package dev.polyglot.spring4.staff;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.polyglot.spring4.auth.UserRow;
import dev.polyglot.spring4.auth.UserView;
import dev.polyglot.spring4.auth.UsersRepository;
import dev.polyglot.spring4.catalog.CatalogService;
import dev.polyglot.spring4.catalog.CatalogViews.ProductView;
import dev.polyglot.spring4.common.ContractException;
import dev.polyglot.spring4.common.PageMeta;
import dev.polyglot.spring4.common.PageResponse;
import dev.polyglot.spring4.orders.OrderViews.OrderView;
import dev.polyglot.spring4.orders.OrdersRepository.PromoRow;
import dev.polyglot.spring4.orders.OrdersRepository;
import dev.polyglot.spring4.orders.OrdersService;
import dev.polyglot.spring4.products.ProductsRepository;
import dev.polyglot.spring4.products.ProductsRepository.ProductRow;

/** Модерация и админка: очередь, вердикты, роли, промокоды, заказы (паритет staff.service). */
@Service
public class StaffService {

    public record PromoCodeInput(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp = "^[A-Z0-9_-]{3,40}$") String code,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp = "percent|fixed") String type,
            @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.DecimalMin(value = "0", inclusive = false) BigDecimal value,
            BigDecimal minSubtotal,
            @jakarta.validation.constraints.Min(1) Integer maxUses,
            java.time.Instant expiresAt) {
    }

    public record RejectInput(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min = 4, max = 500) String reason) {
    }

    public record RoleInput(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp = "buyer|seller|moderator|admin") String role) {
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
        if (!"pending_moderation".equals(p.status())) {
            throw ContractException.conflict("Product is not in the moderation queue.");
        }
        products.setStatus(p.id(), "approved", null);
        return productView(p.id());
    }

    public ProductView reject(String id, String reason) {
        ProductRow p = mustExist(id);
        if (!"pending_moderation".equals(p.status())) {
            throw ContractException.conflict("Product is not in the moderation queue.");
        }
        products.setStatus(p.id(), "rejected", reason);
        return productView(p.id());
    }

    // ---------- админ: пользователи ----------

    public PageResponse<UserView> users(int page, int perPage, String role) {
        List<UserRow> rows = users.page(perPage, (page - 1) * perPage, role);
        int total = users.count(role);
        return new PageResponse<>(rows.stream().map(UserView::of).toList(), PageMeta.of(total, page, perPage));
    }

    public UserView updateRole(String id, String role) {
        UserRow user = users.findById(CatalogService.parseUuid(id))
                .orElseThrow(() -> ContractException.notFound("User not found."));
        users.updateRole(user.id(), role);
        return UserView.of(users.findById(user.id()).orElseThrow());
    }

    // ---------- админ: промокоды ----------

    public List<StaffViews.PromoCodeView> promoCodes() {
        return orders.promoCodes().stream().map(StaffService::promoView).toList();
    }

    @Transactional
    public StaffViews.PromoCodeView createPromoCode(PromoCodeInput input) {
        if ("percent".equals(input.type()) && input.value().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw ContractException.unprocessable("Percent discount cannot exceed 100.");
        }
        if (orders.promoByCode(input.code()).isPresent()) {
            throw ContractException.validation("The given data was invalid.",
                    Map.of("code", List.of("The code has already been taken.")));
        }
        PromoRow promo = new PromoRow(UUID.randomUUID().toString(), input.code(), input.type(), input.value(),
                input.minSubtotal() == null ? BigDecimal.ZERO : input.minSubtotal(), input.maxUses(), 0,
                input.expiresAt() == null ? null : toOffset(input.expiresAt()), true);
        orders.insertPromo(promo);
        return promoView(orders.promoByCode(promo.code()).orElseThrow());
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
            products.delete(p.id());
        } catch (DataIntegrityViolationException e) {
            // FK: товар участвует в заказах (order_items RESTRICT)
            throw ContractException.conflict("Product is referenced by existing orders.");
        }
    }

    // ---------- служебное ----------

    private ProductRow mustExist(String id) {
        return products.findById(CatalogService.parseUuid(id))
                .orElseThrow(() -> ContractException.notFound("Product not found."));
    }

    private ProductView productView(String id) {
        ProductRow p = products.findById(id).orElseThrow();
        return catalog.toView(p, products.relations(List.of(p)).get(p.id()));
    }

    private PageResponse<ProductView> serializePage(ProductsRepository.Paged paged, int page, int perPage) {
        var rels = products.relations(paged.rows());
        List<ProductView> data = paged.rows().stream().map(p -> catalog.toView(p, rels.get(p.id()))).toList();
        return new PageResponse<>(data, PageMeta.of(paged.total(), page, perPage));
    }

    private static StaffViews.PromoCodeView promoView(PromoRow p) {
        return new StaffViews.PromoCodeView(p.id(), p.code(), p.type(), p.value(), p.minSubtotal(),
                p.maxUses(), p.usedCount(), p.expiresAt() == null ? null : p.expiresAt().toInstant(), p.active());
    }

    private static java.time.OffsetDateTime toOffset(java.time.Instant instant) {
        return java.time.OffsetDateTime.ofInstant(instant, java.time.ZoneOffset.UTC);
    }
}
