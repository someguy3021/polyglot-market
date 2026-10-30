package dev.polyglot.spring27.staff;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.polyglot.spring27.auth.UserRow;
import dev.polyglot.spring27.auth.UserView;
import dev.polyglot.spring27.auth.UsersRepository;
import dev.polyglot.spring27.catalog.CatalogService;
import dev.polyglot.spring27.catalog.CatalogViews.ProductView;
import dev.polyglot.spring27.common.ContractException;
import dev.polyglot.spring27.common.PageMeta;
import dev.polyglot.spring27.common.PageResponse;
import dev.polyglot.spring27.orders.OrderViews.OrderView;
import dev.polyglot.spring27.orders.OrdersRepository;
import dev.polyglot.spring27.orders.OrdersRepository.PromoRow;
import dev.polyglot.spring27.orders.OrdersService;
import dev.polyglot.spring27.products.ProductsRepository;
import dev.polyglot.spring27.products.ProductsRepository.ProductRow;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/** Модерация и админка: очередь, вердикты, роли, промокоды, заказы (паритет staff.service). */
@Service
public class StaffService {

    public static class PromoCodeInput {
        @NotBlank
        @Pattern(regexp = "^[A-Z0-9_-]{3,40}$")
        public String code;

        @NotBlank
        @Pattern(regexp = "percent|fixed")
        public String type;

        @NotNull
        @DecimalMin(value = "0", inclusive = false)
        public BigDecimal value;

        public BigDecimal minSubtotal;

        @Min(1)
        public Integer maxUses;

        public Instant expiresAt;
    }

    public static class RejectInput {
        @NotBlank
        @Size(min = 4, max = 500)
        public String reason;
    }

    public static class RoleInput {
        @NotBlank
        @Pattern(regexp = "buyer|seller|moderator|admin")
        public String role;
    }

    private final ProductsRepository products;
    private final UsersRepository users;
    private final OrdersRepository orders;
    private final OrdersService ordersService;
    private final CatalogService catalog;

    public StaffService(ProductsRepository products, UsersRepository users, OrdersRepository orders,
            OrdersService ordersService, CatalogService catalog) {
        this.products = products;
        this.users = users;
        this.orders = orders;
        this.ordersService = ordersService;
        this.catalog = catalog;
    }

    // ---------- модерация ----------

    public PageResponse<ProductView> queue(int page, int perPage) {
        ProductsRepository.Paged paged = products.pagePending(perPage, (page - 1) * perPage);
        return serializePage(paged, page, perPage);
    }

    public ProductView approve(String id) {
        ProductRow p = mustExist(id);
        if (!"pending_moderation".equals(p.status)) {
            throw ContractException.conflict("Product is not in the moderation queue.");
        }
        products.setStatus(p.id, "approved", null);
        return productView(p.id);
    }

    public ProductView reject(String id, String reason) {
        ProductRow p = mustExist(id);
        if (!"pending_moderation".equals(p.status)) {
            throw ContractException.conflict("Product is not in the moderation queue.");
        }
        products.setStatus(p.id, "rejected", reason);
        return productView(p.id);
    }

    // ---------- админ: пользователи ----------

    public PageResponse<UserView> users(int page, int perPage, String role) {
        List<UserRow> rows = users.page(perPage, (page - 1) * perPage, role);
        int total = users.count(role);
        List<UserView> data = new ArrayList<UserView>();
        for (UserRow u : rows) {
            data.add(UserView.of(u));
        }
        return new PageResponse<UserView>(data, PageMeta.of(total, page, perPage));
    }

    public UserView updateRole(String id, String role) {
        UserRow user = users.findById(CatalogService.parseUuid(id));
        if (user == null) {
            throw ContractException.notFound("User not found.");
        }
        users.updateRole(user.id, role);
        return UserView.of(users.findById(user.id));
    }

    // ---------- админ: промокоды ----------

    public List<StaffViews.PromoCodeView> promoCodes() {
        List<StaffViews.PromoCodeView> out = new ArrayList<StaffViews.PromoCodeView>();
        for (PromoRow p : orders.promoCodes()) {
            out.add(promoView(p));
        }
        return out;
    }

    @Transactional
    public StaffViews.PromoCodeView createPromoCode(PromoCodeInput input) {
        if ("percent".equals(input.type) && input.value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw ContractException.unprocessable("Percent discount cannot exceed 100.");
        }
        if (orders.promoByCode(input.code) != null) {
            Map<String, List<String>> details = new HashMap<String, List<String>>();
            details.put("code", Collections.singletonList("The code has already been taken."));
            throw ContractException.validation("The given data was invalid.", details);
        }
        PromoRow promo = new PromoRow(UUID.randomUUID().toString(), input.code, input.type, input.value,
                input.minSubtotal == null ? BigDecimal.ZERO : input.minSubtotal, input.maxUses, 0,
                input.expiresAt == null ? null : OffsetDateTime.ofInstant(input.expiresAt, ZoneOffset.UTC), true);
        orders.insertPromo(promo);
        return promoView(orders.promoByCode(promo.code));
    }

    // ---------- админ: заказы и товары ----------

    public PageResponse<OrderView> orders(int page, int perPage, String status) {
        return ordersService.allForAdmin(page, perPage, status);
    }

    public OrderView changeStatus(String id, String status) {
        return ordersService.changeStatus(id, status);
    }

    @Transactional
    public void deleteProduct(String id) {
        ProductRow p = mustExist(id);
        try {
            products.delete(p.id);
        } catch (DataIntegrityViolationException e) {
            // FK: товар участвует в заказах (order_items RESTRICT)
            throw ContractException.conflict("Product is referenced by existing orders.");
        }
    }

    // ---------- служебное ----------

    private ProductRow mustExist(String id) {
        ProductRow p = products.findById(CatalogService.parseUuid(id));
        if (p == null) {
            throw ContractException.notFound("Product not found.");
        }
        return p;
    }

    private ProductView productView(String id) {
        ProductRow p = products.findById(id);
        return catalog.toView(p, products.relations(Collections.singletonList(p)).get(p.id));
    }

    private PageResponse<ProductView> serializePage(ProductsRepository.Paged paged, int page, int perPage) {
        Map<String, ProductsRepository.Relations> rels = products.relations(paged.rows);
        List<ProductView> data = new ArrayList<ProductView>();
        for (ProductRow p : paged.rows) {
            data.add(catalog.toView(p, rels.get(p.id)));
        }
        return new PageResponse<ProductView>(data, PageMeta.of(paged.total, page, perPage));
    }

    private static StaffViews.PromoCodeView promoView(PromoRow p) {
        return new StaffViews.PromoCodeView(p.id, p.code, p.type, p.value, p.minSubtotal,
                p.maxUses, p.usedCount, p.expiresAt == null ? null : p.expiresAt.toInstant(), p.active);
    }
}
