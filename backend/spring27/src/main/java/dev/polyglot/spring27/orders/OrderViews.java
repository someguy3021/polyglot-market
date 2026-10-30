package dev.polyglot.spring27.orders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Формы заказов по контракту (Order, OrderItem, ShippingMethod, PromoValidation, SellerOrderItem). */
public final class OrderViews {

    public static class ShippingMethodView {
        public final String code;
        public final String name;
        public final BigDecimal price;
        public final int etaDays;

        public ShippingMethodView(String code, String name, BigDecimal price, int etaDays) {
            this.code = code;
            this.name = name;
            this.price = price;
            this.etaDays = etaDays;
        }
    }

    public static class OrderItemView {
        public final String id;
        public final String productId;
        public final String title;
        public final BigDecimal price;
        public final int quantity;

        public OrderItemView(String id, String productId, String title, BigDecimal price, int quantity) {
            this.id = id;
            this.productId = productId;
            this.title = title;
            this.price = price;
            this.quantity = quantity;
        }
    }

    public static class OrderView {
        public final String id;
        public final String userId;
        public final String status;
        public final BigDecimal subtotal;
        public final BigDecimal discount;
        public final BigDecimal shippingPrice;
        public final BigDecimal total;
        public final String promoCode;
        public final ShippingMethodView shippingMethod;
        public final Map<String, Object> shippingAddress;
        public final List<OrderItemView> items;
        public final Instant createdAt;
        public final Instant updatedAt;

        public OrderView(String id, String userId, String status, BigDecimal subtotal, BigDecimal discount,
                BigDecimal shippingPrice, BigDecimal total, String promoCode, ShippingMethodView shippingMethod,
                Map<String, Object> shippingAddress, List<OrderItemView> items, Instant createdAt, Instant updatedAt) {
            this.id = id;
            this.userId = userId;
            this.status = status;
            this.subtotal = subtotal;
            this.discount = discount;
            this.shippingPrice = shippingPrice;
            this.total = total;
            this.promoCode = promoCode;
            this.shippingMethod = shippingMethod;
            this.shippingAddress = shippingAddress;
            this.items = items;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
    }

    public static class PromoValidation {
        public final String code;
        public final boolean valid;
        public final BigDecimal discount;
        public final String reason;

        public PromoValidation(String code, boolean valid, BigDecimal discount, String reason) {
            this.code = code;
            this.valid = valid;
            this.discount = discount;
            this.reason = reason;
        }
    }

    /** Продажа продавца (GET /seller/order-items): позиция чужого заказа по его товару. */
    public static class SellerOrderItemView {
        public final String id;
        public final String orderId;
        public final String orderStatus;
        public final String productTitle;
        public final String title;
        public final BigDecimal price;
        public final int quantity;
        public final Instant createdAt;

        public SellerOrderItemView(String id, String orderId, String orderStatus, String productTitle,
                String title, BigDecimal price, int quantity, Instant createdAt) {
            this.id = id;
            this.orderId = orderId;
            this.orderStatus = orderStatus;
            this.productTitle = productTitle;
            this.title = title;
            this.price = price;
            this.quantity = quantity;
            this.createdAt = createdAt;
        }
    }

    private OrderViews() {
    }
}
