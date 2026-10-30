package dev.polyglot.spring27.orders;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/** SQL-доступ к orders/order_items/idempotency_keys/promo_codes/shipping_methods. */
@Repository
public class OrdersRepository {

    public static class OrderRow {
        public final String id;
        public final String userId;
        public final String status;
        public final BigDecimal subtotal;
        public final BigDecimal discount;
        public final BigDecimal shippingPrice;
        public final BigDecimal total;
        public final String promoCodeId;
        public final String shippingMethodId;
        public final String shippingAddressJson;
        public final OffsetDateTime createdAt;
        public final OffsetDateTime updatedAt;

        public OrderRow(String id, String userId, String status, BigDecimal subtotal, BigDecimal discount,
                BigDecimal shippingPrice, BigDecimal total, String promoCodeId, String shippingMethodId,
                String shippingAddressJson, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
            this.id = id;
            this.userId = userId;
            this.status = status;
            this.subtotal = subtotal;
            this.discount = discount;
            this.shippingPrice = shippingPrice;
            this.total = total;
            this.promoCodeId = promoCodeId;
            this.shippingMethodId = shippingMethodId;
            this.shippingAddressJson = shippingAddressJson;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
    }

    public static class OrderItemRow {
        public final String id;
        public final String orderId;
        public final String productId;
        public final String sellerId;
        public final String title;
        public final BigDecimal price;
        public final int quantity;

        public OrderItemRow(String id, String orderId, String productId, String sellerId,
                String title, BigDecimal price, int quantity) {
            this.id = id;
            this.orderId = orderId;
            this.productId = productId;
            this.sellerId = sellerId;
            this.title = title;
            this.price = price;
            this.quantity = quantity;
        }
    }

    public static class ShippingMethodRow {
        public final String id;
        public final String code;
        public final String name;
        public final BigDecimal price;
        public final int etaDays;

        public ShippingMethodRow(String id, String code, String name, BigDecimal price, int etaDays) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.price = price;
            this.etaDays = etaDays;
        }
    }

    public static class PromoRow {
        public final String id;
        public final String code;
        public final String type;
        public final BigDecimal value;
        public final BigDecimal minSubtotal;
        public final Integer maxUses;
        public final int usedCount;
        public final OffsetDateTime expiresAt;
        public final boolean active;

        public PromoRow(String id, String code, String type, BigDecimal value, BigDecimal minSubtotal,
                Integer maxUses, int usedCount, OffsetDateTime expiresAt, boolean active) {
            this.id = id;
            this.code = code;
            this.type = type;
            this.value = value;
            this.minSubtotal = minSubtotal;
            this.maxUses = maxUses;
            this.usedCount = usedCount;
            this.expiresAt = expiresAt;
            this.active = active;
        }
    }

    private static final RowMapper<OrderRow> ORDER = new RowMapper<OrderRow>() {
        @Override
        public OrderRow mapRow(ResultSet rs, int i) throws SQLException {
            return new OrderRow(
                    rs.getString("id"),
                    rs.getString("user_id"),
                    rs.getString("status"),
                    rs.getBigDecimal("subtotal"),
                    rs.getBigDecimal("discount"),
                    rs.getBigDecimal("shipping_price"),
                    rs.getBigDecimal("total"),
                    rs.getString("promo_code_id"),
                    rs.getString("shipping_method_id"),
                    rs.getString("shipping_address"),
                    rs.getObject("created_at", OffsetDateTime.class),
                    rs.getObject("updated_at", OffsetDateTime.class));
        }
    };

    private static final RowMapper<OrderItemRow> ITEM = new RowMapper<OrderItemRow>() {
        @Override
        public OrderItemRow mapRow(ResultSet rs, int i) throws SQLException {
            return new OrderItemRow(rs.getString("id"), rs.getString("order_id"), rs.getString("product_id"),
                    rs.getString("seller_id"), rs.getString("title"), rs.getBigDecimal("price"), rs.getInt("quantity"));
        }
    };

    private static final RowMapper<ShippingMethodRow> SHIPPING = new RowMapper<ShippingMethodRow>() {
        @Override
        public ShippingMethodRow mapRow(ResultSet rs, int i) throws SQLException {
            return new ShippingMethodRow(rs.getString("id"), rs.getString("code"), rs.getString("name"),
                    rs.getBigDecimal("price"), rs.getInt("eta_days"));
        }
    };

    private static final RowMapper<PromoRow> PROMO = new RowMapper<PromoRow>() {
        @Override
        public PromoRow mapRow(ResultSet rs, int i) throws SQLException {
            return new PromoRow(rs.getString("id"), rs.getString("code"), rs.getString("type"),
                    rs.getBigDecimal("value"), rs.getBigDecimal("min_subtotal"),
                    (Integer) rs.getObject("max_uses"), rs.getInt("used_count"),
                    rs.getObject("expires_at", OffsetDateTime.class), rs.getBoolean("active"));
        }
    };

    private final JdbcTemplate jdbc;

    public OrdersRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ---------- справочники ----------

    public List<ShippingMethodRow> shippingMethods() {
        return jdbc.query("SELECT * FROM shipping_methods WHERE active = true ORDER BY price ASC", SHIPPING);
    }

    public ShippingMethodRow activeShippingByCode(String code) {
        return single(jdbc.query("SELECT * FROM shipping_methods WHERE code = ? AND active = true", SHIPPING, code));
    }

    public ShippingMethodRow shippingById(String id) {
        return single(jdbc.query("SELECT * FROM shipping_methods WHERE id = ?::uuid", SHIPPING, id));
    }

    public PromoRow promoByCode(String code) {
        return single(jdbc.query("SELECT * FROM promo_codes WHERE code = ?", PROMO, code));
    }

    public PromoRow promoById(String id) {
        return single(jdbc.query("SELECT * FROM promo_codes WHERE id = ?::uuid", PROMO, id));
    }

    public List<PromoRow> promoCodes() {
        return jdbc.query("SELECT * FROM promo_codes ORDER BY code ASC", PROMO);
    }

    public void incrementPromoUsed(String promoId) {
        jdbc.update("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?::uuid", promoId);
    }

    public void insertPromo(PromoRow p) {
        jdbc.update("INSERT INTO promo_codes (id, code, type, value, min_subtotal, max_uses, used_count, expires_at, active) "
                        + "VALUES (?::uuid, ?, ?::promo_type, ?, ?, ?, ?, ?, ?)",
                p.id, p.code, p.type, p.value, p.minSubtotal, p.maxUses, p.usedCount, p.expiresAt, p.active);
    }

    // ---------- заказы ----------

    public void insertOrder(String id, String userId, BigDecimal subtotal, BigDecimal discount,
            BigDecimal shippingPrice, BigDecimal total, String promoCodeId, String shippingMethodId,
            String shippingAddressJson) {
        jdbc.update("INSERT INTO orders (id, user_id, status, subtotal, discount, shipping_price, total, "
                        + "promo_code_id, shipping_method_id, shipping_address) "
                        + "VALUES (?::uuid, ?::uuid, 'new', ?, ?, ?, ?, ?::uuid, ?::uuid, ?::jsonb)",
                id, userId, subtotal, discount, shippingPrice, total, promoCodeId, shippingMethodId,
                shippingAddressJson);
    }

    public void insertOrderItem(String id, String orderId, String productId, String sellerId,
            String title, BigDecimal price, int quantity) {
        jdbc.update("INSERT INTO order_items (id, order_id, product_id, seller_id, title, price, quantity) "
                        + "VALUES (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, ?, ?)",
                id, orderId, productId, sellerId, title, price, quantity);
    }

    public void insertIdempotency(String key, String userId, String orderId) {
        jdbc.update("INSERT INTO idempotency_keys (key, user_id, order_id) VALUES (?::uuid, ?::uuid, ?::uuid)",
                key, userId, orderId);
    }

    public String idempotentOrder(String key, String userId) {
        List<String> rows = jdbc.queryForList(
                "SELECT order_id FROM idempotency_keys WHERE key = ?::uuid AND user_id = ?::uuid", String.class, key, userId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public OrderRow findOrder(String id) {
        return single(jdbc.query("SELECT * FROM orders WHERE id = ?::uuid", ORDER, id));
    }

    public List<OrderRow> ordersByUser(String userId, int limit, int offset) {
        return jdbc.query("SELECT * FROM orders WHERE user_id = ?::uuid ORDER BY created_at DESC LIMIT ? OFFSET ?",
                ORDER, userId, limit, offset);
    }

    public int countOrdersByUser(String userId) {
        return jdbc.queryForObject("SELECT count(*) FROM orders WHERE user_id = ?::uuid", Integer.class, userId);
    }

    public List<OrderRow> ordersPage(int limit, int offset, String status) {
        List<Object> params = new ArrayList<Object>();
        String where = "";
        if (status != null) {
            where = " WHERE status = ?::order_status";
            params.add(status);
        }
        params.add(limit);
        params.add(offset);
        return jdbc.query("SELECT * FROM orders" + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?",
                ORDER, params.toArray());
    }

    public int countOrders(String status) {
        if (status == null) {
            return jdbc.queryForObject("SELECT count(*) FROM orders", Integer.class);
        }
        return jdbc.queryForObject("SELECT count(*) FROM orders WHERE status = ?::order_status", Integer.class, status);
    }

    public void updateStatus(String id, String status) {
        jdbc.update("UPDATE orders SET status = ?::order_status, updated_at = now() WHERE id = ?::uuid", status, id);
    }

    public List<OrderItemRow> itemsByOrder(String orderId) {
        // в order_items нет created_at — порядок вставки детерминируем id
        return jdbc.query("SELECT * FROM order_items WHERE order_id = ?::uuid ORDER BY id ASC", ITEM, orderId);
    }

    /** Продажи продавца: позиции чужих заказов по своим товарам (GET /seller/order-items). */
    public List<OrderItemRow> orderItemsBySeller(String sellerId, int limit, int offset) {
        return jdbc.query("SELECT oi.* FROM order_items oi WHERE oi.seller_id = ?::uuid ORDER BY oi.id ASC LIMIT ? OFFSET ?",
                ITEM, sellerId, limit, offset);
    }

    public int countOrderItemsBySeller(String sellerId) {
        return jdbc.queryForObject("SELECT count(*) FROM order_items WHERE seller_id = ?::uuid",
                Integer.class, sellerId);
    }

    private static <T> T single(List<T> rows) {
        return rows.isEmpty() ? null : rows.get(0);
    }
}
