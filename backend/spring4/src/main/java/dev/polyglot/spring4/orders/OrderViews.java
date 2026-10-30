package dev.polyglot.spring4.orders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Формы заказов по контракту (Order, OrderItem, ShippingMethod, PromoValidation). */
public final class OrderViews {

    public record ShippingMethodView(String code, String name, BigDecimal price, int etaDays) {
    }

    public record OrderItemView(String id, String productId, String title, BigDecimal price, int quantity) {
    }

    public record OrderView(
            String id,
            String userId,
            String status,
            BigDecimal subtotal,
            BigDecimal discount,
            BigDecimal shippingPrice,
            BigDecimal total,
            String promoCode,
            ShippingMethodView shippingMethod,
            Map<String, Object> shippingAddress,
            List<OrderItemView> items,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record PromoValidation(String code, boolean valid, BigDecimal discount, String reason) {
    }

    /** Продажа продавца (GET /seller/order-items): позиция чужого заказа по его товару. */
    public record SellerOrderItemView(
            String id,
            String orderId,
            String orderStatus,
            String productTitle,
            String title,
            BigDecimal price,
            int quantity,
            Instant createdAt) {
    }

    private OrderViews() {
    }
}
