package dev.polyglot.spring27.orders;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import dev.polyglot.spring27.auth.UserRow;
import dev.polyglot.spring27.cart.CartRepository;
import dev.polyglot.spring27.cart.CartRepository.CartItemRow;
import dev.polyglot.spring27.cart.CartRepository.CartRow;
import dev.polyglot.spring27.catalog.CatalogService;
import dev.polyglot.spring27.common.ContractException;
import dev.polyglot.spring27.common.PageMeta;
import dev.polyglot.spring27.common.PageResponse;
import dev.polyglot.spring27.orders.OrderViews.OrderItemView;
import dev.polyglot.spring27.orders.OrderViews.OrderView;
import dev.polyglot.spring27.orders.OrderViews.ShippingMethodView;
import dev.polyglot.spring27.orders.OrdersRepository.OrderItemRow;
import dev.polyglot.spring27.orders.OrdersRepository.OrderRow;
import dev.polyglot.spring27.orders.OrdersRepository.PromoRow;
import dev.polyglot.spring27.orders.OrdersRepository.ShippingMethodRow;
import dev.polyglot.spring27.products.ProductsRepository;
import dev.polyglot.spring27.products.ProductsRepository.ProductRow;

/**
 * Заказы: идемпотентный чекаут (ADR-011), промокоды, переходы статусов.
 * Поведение — поэтапный паритет NestJS orders.service.
 */
@Service
public class OrdersService {

    /** Допустимые переходы статусов заказа (контракт PUT /admin/orders/{id}/status). */
    static final Map<String, List<String>> TRANSITIONS = transitions();

    private static Map<String, List<String>> transitions() {
        Map<String, List<String>> m = new HashMap<String, List<String>>();
        m.put("new", Arrays.asList("paid", "cancelled"));
        m.put("paid", Arrays.asList("shipped", "cancelled"));
        m.put("shipped", Collections.singletonList("done"));
        m.put("done", Collections.<String>emptyList());
        m.put("cancelled", Collections.<String>emptyList());
        return m;
    }

    public static class AddressInput {
        @javax.validation.constraints.NotBlank
        @javax.validation.constraints.Size(max = 200)
        public String line1;

        @javax.validation.constraints.Size(max = 200)
        public String line2;

        @javax.validation.constraints.NotBlank
        @javax.validation.constraints.Size(max = 100)
        public String city;

        @javax.validation.constraints.NotBlank
        @javax.validation.constraints.Size(max = 20)
        public String zip;

        @javax.validation.constraints.NotBlank
        @javax.validation.constraints.Size(min = 2, max = 2)
        public String country;
    }

    public static class OrderInput {
        @javax.validation.constraints.NotBlank
        public String shippingMethodCode;

        public String promoCode;

        @javax.validation.constraints.NotNull
        @javax.validation.Valid
        public AddressInput shippingAddress;
    }

    public static class Created {
        public final boolean created;
        public final OrderView view;

        public Created(boolean created, OrderView view) {
            this.created = created;
            this.view = view;
        }
    }

    private final OrdersRepository orders;
    private final CartRepository carts;
    private final ProductsRepository products;
    private final ObjectMapper json; // Jackson 2 — дефолтный JSON-стек Boot 2.7

    public OrdersService(OrdersRepository orders, CartRepository carts, ProductsRepository products, ObjectMapper json) {
        this.orders = orders;
        this.carts = carts;
        this.products = products;
        this.json = json;
    }

    public List<ShippingMethodView> shippingMethods() {
        List<ShippingMethodView> out = new ArrayList<ShippingMethodView>();
        for (ShippingMethodRow m : orders.shippingMethods()) {
            out.add(shippingView(m));
        }
        return out;
    }

    public OrderViews.PromoValidation validatePromo(String code, BigDecimal subtotal) {
        PromoRow promo = orders.promoByCode(code);
        String reason = promo == null ? null : rejectionReason(promo, subtotal);
        if (reason != null) {
            throw ContractException.unprocessable(reason);
        }
        return new OrderViews.PromoValidation(promo.code, true, discountFor(promo, subtotal), null);
    }

    /** Оформление: идемпотентно по (key, userId); транзакция с FOR UPDATE на корзину и товары. */
    @Transactional
    public Created create(String userId, String idempotencyKey, OrderInput input) {
        if (idempotencyKey == null || !isUuid(idempotencyKey)) {
            Map<String, List<String>> details = new LinkedHashMap<String, List<String>>();
            details.put("Idempotency-Key",
                    Collections.singletonList("A valid UUID Idempotency-Key header is required."));
            throw ContractException.validation("The given data was invalid.", details);
        }
        String existingOrderId = orders.idempotentOrder(idempotencyKey, userId);
        if (existingOrderId != null) {
            return new Created(false, toView(orders.findOrder(existingOrderId)));
        }

        CartRow cart = carts.lockByUserAndNotConverted(userId);
        List<CartItemRow> cartItems = cart == null ? Collections.<CartItemRow>emptyList() : carts.itemsByCart(cart.id);
        if (cart == null || cartItems.isEmpty()) {
            throw ContractException.conflict("Cart is empty.");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<ProductRow> productRows = new ArrayList<ProductRow>();
        for (CartItemRow item : cartItems) {
            ProductRow product = products.lockById(item.productId);
            if (product == null || !"approved".equals(product.status)) {
                throw ContractException.conflict("Product is not available for purchase.");
            }
            if (product.stock < item.quantity) {
                throw ContractException.conflict("Insufficient stock for " + product.title + ".");
            }
            subtotal = subtotal.add(product.price.multiply(BigDecimal.valueOf(item.quantity)));
            productRows.add(product);
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

        PromoRow promo = null;
        BigDecimal discount = BigDecimal.ZERO;
        if (input.promoCode != null) {
            promo = orders.promoByCode(input.promoCode);
            String reason = promo == null ? null : rejectionReason(promo, subtotal);
            if (reason != null) {
                throw ContractException.unprocessable(reason);
            }
            discount = discountFor(promo, subtotal);
        }

        ShippingMethodRow method = orders.activeShippingByCode(input.shippingMethodCode);
        if (method == null) {
            throw ContractException.unprocessable("Unknown shipping method.");
        }

        BigDecimal shippingPrice = method.price;
        BigDecimal total = subtotal.subtract(discount).add(shippingPrice).setScale(2, RoundingMode.HALF_UP);

        String orderId = UUID.randomUUID().toString();
        orders.insertOrder(orderId, userId, subtotal, discount, shippingPrice, total,
                promo == null ? null : promo.id, method.id, addressJson(input.shippingAddress));

        for (int i = 0; i < cartItems.size(); i++) {
            CartItemRow item = cartItems.get(i);
            ProductRow product = productRows.get(i);
            orders.insertOrderItem(UUID.randomUUID().toString(), orderId, product.id, product.sellerId,
                    product.title, product.price, item.quantity);
            products.decrementStock(product.id, item.quantity);
        }
        if (promo != null) {
            orders.incrementPromoUsed(promo.id);
        }
        // корзина после оформления пуста: позиции списаны в заказ
        carts.deleteItemsOfCart(cart.id);
        carts.setConverted(cart.id, true);
        orders.insertIdempotency(idempotencyKey, userId, orderId);

        return new Created(true, toView(orders.findOrder(orderId)));
    }

    public PageResponse<OrderView> listMine(String userId, int page, int perPage) {
        List<OrderRow> rows = orders.ordersByUser(userId, perPage, (page - 1) * perPage);
        int total = orders.countOrdersByUser(userId);
        List<OrderView> data = new ArrayList<OrderView>();
        for (OrderRow o : rows) {
            data.add(toView(o));
        }
        return new PageResponse<OrderView>(data, PageMeta.of(total, page, perPage));
    }

    public OrderView oneFor(UserRow requester, String id) {
        OrderRow order = orders.findOrder(CatalogService.parseUuid(id));
        if (order == null) {
            throw ContractException.notFound("Order not found.");
        }
        boolean staff = "moderator".equals(requester.role) || "admin".equals(requester.role);
        if (!order.userId.equals(requester.id) && !staff) {
            throw ContractException.forbidden("Forbidden.");
        }
        return toView(order);
    }

    public PageResponse<OrderView> allForAdmin(int page, int perPage, String status) {
        List<OrderRow> rows = orders.ordersPage(perPage, (page - 1) * perPage, status);
        int total = orders.countOrders(status);
        List<OrderView> data = new ArrayList<OrderView>();
        for (OrderRow o : rows) {
            data.add(toView(o));
        }
        return new PageResponse<OrderView>(data, PageMeta.of(total, page, perPage));
    }

    public OrderView changeStatus(String id, String status) {
        OrderRow order = orders.findOrder(CatalogService.parseUuid(id));
        if (order == null) {
            throw ContractException.notFound("Order not found.");
        }
        List<String> allowed = TRANSITIONS.containsKey(order.status)
                ? TRANSITIONS.get(order.status) : Collections.<String>emptyList();
        if (!allowed.contains(status)) {
            throw ContractException.conflict("Invalid transition " + order.status + " → " + status + ".");
        }
        orders.updateStatus(order.id, status);
        return toView(orders.findOrder(order.id));
    }

    // ---------- сериализация ----------

    public OrderView toView(OrderRow o) {
        List<OrderItemRow> items = orders.itemsByOrder(o.id);
        ShippingMethodRow method = orders.shippingById(o.shippingMethodId);
        String promoCode = o.promoCodeId == null ? null : promoCodeOrNull(o.promoCodeId);
        return new OrderView(
                o.id, o.userId, o.status, o.subtotal, o.discount, o.shippingPrice, o.total,
                promoCode, shippingView(method), addressMap(o.shippingAddressJson),
                itemsToViews(items), o.createdAt.toInstant(), o.updatedAt.toInstant());
    }

    private String promoCodeOrNull(String promoCodeId) {
        PromoRow promo = orders.promoById(promoCodeId);
        return promo == null ? null : promo.code;
    }

    private static List<OrderItemView> itemsToViews(List<OrderItemRow> items) {
        List<OrderItemView> out = new ArrayList<OrderItemView>();
        for (OrderItemRow i : items) {
            out.add(new OrderItemView(i.id, i.productId, i.title, i.price, i.quantity));
        }
        return out;
    }

    private String addressJson(AddressInput a) {
        Map<String, Object> map = new LinkedHashMap<String, Object>();
        map.put("line1", a.line1);
        if (a.line2 != null) {
            map.put("line2", a.line2);
        }
        map.put("city", a.city);
        map.put("zip", a.zip);
        map.put("country", a.country);
        try {
            return json.writeValueAsString(map);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("shipping address serialization failed", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> addressMap(String jsonRaw) {
        try {
            return json.readValue(jsonRaw, Map.class);
        } catch (java.io.IOException e) {
            throw new IllegalStateException("shipping address deserialization failed", e);
        }
    }

    private static ShippingMethodView shippingView(ShippingMethodRow m) {
        return new ShippingMethodView(m.code, m.name, m.price, m.etaDays);
    }

    private static boolean isUuid(String raw) {
        try {
            UUID.fromString(raw);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static String rejectionReason(PromoRow promo, BigDecimal subtotal) {
        if (!promo.active) {
            return "Promo code is inactive.";
        }
        if (promo.expiresAt != null && promo.expiresAt.toInstant().toEpochMilli() < System.currentTimeMillis()) {
            return "Promo code has expired.";
        }
        if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
            return "Promo code usage limit reached.";
        }
        if (subtotal.compareTo(promo.minSubtotal) < 0) {
            return "Promo code requires a minimum subtotal of "
                    + promo.minSubtotal.stripTrailingZeros().toPlainString() + ".";
        }
        return null;
    }

    private static BigDecimal discountFor(PromoRow promo, BigDecimal subtotal) {
        BigDecimal raw = "percent".equals(promo.type)
                ? subtotal.multiply(promo.value).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                : promo.value;
        return raw.min(subtotal).setScale(2, RoundingMode.HALF_UP);
    }
}
