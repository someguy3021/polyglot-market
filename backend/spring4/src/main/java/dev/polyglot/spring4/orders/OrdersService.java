package dev.polyglot.spring4.orders;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.polyglot.spring4.auth.UserRow;
import dev.polyglot.spring4.cart.CartRepository;
import dev.polyglot.spring4.cart.CartRepository.CartItemRow;
import dev.polyglot.spring4.cart.CartRepository.CartRow;
import dev.polyglot.spring4.common.ContractException;
import dev.polyglot.spring4.common.PageMeta;
import dev.polyglot.spring4.common.PageResponse;
import dev.polyglot.spring4.orders.OrdersRepository.OrderItemRow;
import dev.polyglot.spring4.orders.OrdersRepository.OrderRow;
import dev.polyglot.spring4.orders.OrdersRepository.PromoRow;
import dev.polyglot.spring4.orders.OrdersRepository.ShippingMethodRow;
import dev.polyglot.spring4.orders.OrderViews.OrderItemView;
import dev.polyglot.spring4.orders.OrderViews.OrderView;
import dev.polyglot.spring4.orders.OrderViews.ShippingMethodView;
import dev.polyglot.spring4.products.ProductsRepository;
import dev.polyglot.spring4.products.ProductsRepository.ProductRow;

/**
 * Заказы: идемпотентный чекаут (ADR-011), промокоды, переходы статусов.
 * Поведение — поэтапный паритет NestJS orders.service.
 */
@Service
public class OrdersService {

    /** Допустимые переходы статусов заказа (контракт PUT /admin/orders/{id}/status). */
    static final Map<String, List<String>> TRANSITIONS = Map.of(
            "new", List.of("paid", "cancelled"),
            "paid", List.of("shipped", "cancelled"),
            "shipped", List.of("done"),
            "done", List.of(),
            "cancelled", List.of());

    public record OrderInput(String shippingMethodCode, String promoCode, AddressInput shippingAddress) {
    }

    public record AddressInput(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 200) String line1,
            @jakarta.validation.constraints.Size(max = 200) String line2,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 100) String city,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 20) String zip,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min = 2, max = 2) String country) {
    }

    public record Created(boolean created, OrderView view) {
    }

    private final OrdersRepository orders;
    private final CartRepository carts;
    private final ProductsRepository products;
    // Jackson 3 (tools.jackson) — дефолтный JSON-стек Spring Boot 4
    private final tools.jackson.databind.ObjectMapper json = new tools.jackson.databind.ObjectMapper();

    public OrdersService(OrdersRepository orders, CartRepository carts, ProductsRepository products) {
        this.orders = orders;
        this.carts = carts;
        this.products = products;
    }

    public List<ShippingMethodView> shippingMethods() {
        return orders.shippingMethods().stream().map(OrdersService::shippingView).toList();
    }

    public OrderViews.PromoValidation validatePromo(String code, BigDecimal subtotal) {
        PromoRow promo = orders.promoByCode(code).orElse(null);
        String reason = promo == null ? null : rejectionReason(promo, subtotal);
        if (reason != null) {
            throw ContractException.unprocessable(reason);
        }
        return new OrderViews.PromoValidation(promo.code(), true, discountFor(promo, subtotal), null);
    }

    /** Оформление: идемпотентно по (key, userId); транзакция с FOR UPDATE на корзину и товары. */
    @Transactional
    public Created create(String userId, String idempotencyKey, OrderInput input) {
        if (idempotencyKey == null || !isUuid(idempotencyKey)) {
            throw ContractException.validation("The given data was invalid.",
                    Map.of("Idempotency-Key", List.of("A valid UUID Idempotency-Key header is required.")));
        }
        String existingOrderId = orders.idempotentOrder(idempotencyKey, userId).orElse(null);
        if (existingOrderId != null) {
            return new Created(false, toView(orders.findOrder(existingOrderId).orElseThrow()));
        }

        CartRow cart = carts.lockByUserAndNotConverted(userId).orElse(null);
        List<CartItemRow> cartItems = cart == null ? List.of() : carts.itemsByCart(cart.id());
        if (cart == null || cartItems.isEmpty()) {
            throw ContractException.conflict("Cart is empty.");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<ProductRow> productRows = new ArrayList<>();
        for (CartItemRow item : cartItems) {
            ProductRow product = products.lockById(item.productId())
                    .orElseThrow(() -> ContractException.conflict("Product is not available for purchase."));
            if (!"approved".equals(product.status())) {
                throw ContractException.conflict("Product is not available for purchase.");
            }
            if (product.stock() < item.quantity()) {
                throw ContractException.conflict("Insufficient stock for " + product.title() + ".");
            }
            subtotal = subtotal.add(product.price().multiply(BigDecimal.valueOf(item.quantity())));
            productRows.add(product);
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

        PromoRow promo = null;
        BigDecimal discount = BigDecimal.ZERO;
        if (input.promoCode() != null) {
            promo = orders.promoByCode(input.promoCode()).orElse(null);
            String reason = promo == null ? null : rejectionReason(promo, subtotal);
            if (reason != null) {
                throw ContractException.unprocessable(reason != null ? reason : "Promo code not found.");
            }
            discount = discountFor(promo, subtotal);
        }

        ShippingMethodRow method = orders.activeShippingByCode(input.shippingMethodCode())
                .orElseThrow(() -> ContractException.unprocessable("Unknown shipping method."));

        BigDecimal shippingPrice = method.price();
        BigDecimal total = subtotal.subtract(discount).add(shippingPrice).setScale(2, RoundingMode.HALF_UP);

        String orderId = UUID.randomUUID().toString();
        orders.insertOrder(orderId, userId, subtotal, discount, shippingPrice, total,
                promo == null ? null : promo.id(), method.id(), addressJson(input.shippingAddress()));

        for (int i = 0; i < cartItems.size(); i++) {
            CartItemRow item = cartItems.get(i);
            ProductRow product = productRows.get(i);
            orders.insertOrderItem(UUID.randomUUID().toString(), orderId, product.id(), product.sellerId(),
                    product.title(), product.price(), item.quantity());
            products.decrementStock(product.id(), item.quantity());
        }
        if (promo != null) {
            orders.incrementPromoUsed(promo.id());
        }
        // корзина после оформления пуста: позиции списаны в заказ
        carts.deleteItemsOfCart(cart.id());
        carts.setConverted(cart.id(), true);
        orders.insertIdempotency(idempotencyKey, userId, orderId);

        return new Created(true, toView(orders.findOrder(orderId).orElseThrow()));
    }

    public PageResponse<OrderView> listMine(String userId, int page, int perPage) {
        OrdersRepository.Paged<OrderRow> paged = orders.ordersByUser(userId, perPage, (page - 1) * perPage);
        List<OrderView> data = paged.rows().stream().map(this::toView).toList();
        return new PageResponse<>(data, PageMeta.of(paged.total(), page, perPage));
    }

    public OrderView oneFor(UserRow requester, String id) {
        OrderRow order = orders.findOrder(dev.polyglot.spring4.catalog.CatalogService.parseUuid(id))
                .orElseThrow(() -> ContractException.notFound("Order not found."));
        boolean staff = "moderator".equals(requester.role()) || "admin".equals(requester.role());
        if (!order.userId().equals(requester.id()) && !staff) {
            throw ContractException.forbidden("Forbidden.");
        }
        return toView(order);
    }

    public PageResponse<OrderView> allForAdmin(int page, int perPage, String status) {
        OrdersRepository.Paged<OrderRow> paged = orders.ordersPage(perPage, (page - 1) * perPage, status);
        List<OrderView> data = paged.rows().stream().map(this::toView).toList();
        return new PageResponse<>(data, PageMeta.of(paged.total(), page, perPage));
    }

    public OrderView changeStatus(String id, String status) {
        OrderRow order = orders.findOrder(dev.polyglot.spring4.catalog.CatalogService.parseUuid(id))
                .orElseThrow(() -> ContractException.notFound("Order not found."));
        List<String> allowed = TRANSITIONS.getOrDefault(order.status(), List.of());
        if (!allowed.contains(status)) {
            throw ContractException.conflict("Invalid transition " + order.status() + " → " + status + ".");
        }
        orders.updateStatus(order.id(), status);
        return toView(orders.findOrder(order.id()).orElseThrow());
    }

    // ---------- сериализация ----------

    public OrderView toView(OrderRow o) {
        List<OrderItemRow> items = orders.itemsByOrder(o.id());
        ShippingMethodRow method = orders.shippingById(o.shippingMethodId());
        String promoCode = o.promoCodeId() == null ? null
                : orders.promoById(o.promoCodeId()).map(PromoRow::code).orElse(null);
        return new OrderView(
                o.id(), o.userId(), o.status(), o.subtotal(), o.discount(), o.shippingPrice(), o.total(),
                promoCode, shippingView(method), addressMap(o.shippingAddressJson()),
                items.stream().map(i -> new OrderItemView(i.id(), i.productId(), i.title(), i.price(), i.quantity())).toList(),
                o.createdAt().toInstant(), o.updatedAt().toInstant());
    }

    private String addressJson(AddressInput a) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("line1", a.line1());
        if (a.line2() != null) map.put("line2", a.line2());
        map.put("city", a.city());
        map.put("zip", a.zip());
        map.put("country", a.country());
        return json.writeValueAsString(map); // Jackson 3: исключения unchecked
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> addressMap(String jsonRaw) {
        return json.readValue(jsonRaw, Map.class);
    }

    private static ShippingMethodView shippingView(ShippingMethodRow m) {
        return new ShippingMethodView(m.code(), m.name(), m.price(), m.etaDays());
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
        if (!promo.active()) {
            return "Promo code is inactive.";
        }
        if (promo.expiresAt() != null && promo.expiresAt().toInstant().toEpochMilli() < System.currentTimeMillis()) {
            return "Promo code has expired.";
        }
        if (promo.maxUses() != null && promo.usedCount() >= promo.maxUses()) {
            return "Promo code usage limit reached.";
        }
        if (subtotal.compareTo(promo.minSubtotal()) < 0) {
            return "Promo code requires a minimum subtotal of " + promo.minSubtotal().stripTrailingZeros().toPlainString() + ".";
        }
        return null;
    }

    private static BigDecimal discountFor(PromoRow promo, BigDecimal subtotal) {
        BigDecimal raw = "percent".equals(promo.type())
                ? subtotal.multiply(promo.value()).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                : promo.value();
        return raw.min(subtotal).setScale(2, RoundingMode.HALF_UP);
    }
}
