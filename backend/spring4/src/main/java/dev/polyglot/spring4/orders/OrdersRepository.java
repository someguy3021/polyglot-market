package dev.polyglot.spring4.orders;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** SQL-доступ к orders/order_items/idempotency_keys/promo_codes/shipping_methods. */
@Repository
public class OrdersRepository {

    public record OrderRow(
            String id,
            String userId,
            String status,
            BigDecimal subtotal,
            BigDecimal discount,
            BigDecimal shippingPrice,
            BigDecimal total,
            String promoCodeId,
            String shippingMethodId,
            String shippingAddressJson,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {
    }

    public record OrderItemRow(String id, String orderId, String productId, String sellerId,
            String title, BigDecimal price, int quantity) {
    }

    public record ShippingMethodRow(String id, String code, String name, BigDecimal price, int etaDays) {
    }

    public record PromoRow(String id, String code, String type, BigDecimal value, BigDecimal minSubtotal,
            Integer maxUses, int usedCount, OffsetDateTime expiresAt, boolean active) {
    }

    public record Paged<T>(List<T> rows, int total) {
    }

    private final JdbcClient jdbc;

    public OrdersRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // ---------- справочники ----------

    public List<ShippingMethodRow> shippingMethods() {
        return jdbc.sql("SELECT * FROM shipping_methods WHERE active = true ORDER BY price ASC")
                .query(OrdersRepository::shipping)
                .list();
    }

    public Optional<ShippingMethodRow> activeShippingByCode(String code) {
        return jdbc.sql("SELECT * FROM shipping_methods WHERE code = ? AND active = true")
                .param(code)
                .query(OrdersRepository::shipping)
                .optional();
    }

    public ShippingMethodRow shippingById(String id) {
        return jdbc.sql("SELECT * FROM shipping_methods WHERE id = ?::uuid")
                .param(id)
                .query(OrdersRepository::shipping)
                .single();
    }

    public Optional<PromoRow> promoByCode(String code) {
        return jdbc.sql("SELECT * FROM promo_codes WHERE code = ?")
                .param(code)
                .query(OrdersRepository::promo)
                .optional();
    }

    public Optional<PromoRow> promoById(String id) {
        return jdbc.sql("SELECT * FROM promo_codes WHERE id = ?::uuid")
                .param(id)
                .query(OrdersRepository::promo)
                .optional();
    }

    public List<PromoRow> promoCodes() {
        return jdbc.sql("SELECT * FROM promo_codes ORDER BY code ASC")
                .query(OrdersRepository::promo)
                .list();
    }

    public void incrementPromoUsed(String promoId) {
        jdbc.sql("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?::uuid")
                .param(promoId)
                .update();
    }

    public void insertPromo(PromoRow p) {
        jdbc.sql("""
                        INSERT INTO promo_codes (id, code, type, value, min_subtotal, max_uses, used_count, expires_at, active)
                        VALUES (?::uuid, ?, ?::promo_type, ?, ?, ?, ?, ?, ?)
                        """)
                .param(p.id()).param(p.code()).param(p.type()).param(p.value()).param(p.minSubtotal())
                .param(p.maxUses()).param(p.usedCount()).param(p.expiresAt()).param(p.active())
                .update();
    }

    // ---------- заказы ----------

    public void insertOrder(String id, String userId, BigDecimal subtotal, BigDecimal discount,
            BigDecimal shippingPrice, BigDecimal total, String promoCodeId, String shippingMethodId,
            String shippingAddressJson) {
        jdbc.sql("""
                        INSERT INTO orders (id, user_id, status, subtotal, discount, shipping_price, total,
                                            promo_code_id, shipping_method_id, shipping_address)
                        VALUES (?::uuid, ?::uuid, 'new', ?, ?, ?, ?, ?::uuid, ?::uuid, ?::jsonb)
                        """)
                .param(id).param(userId)
                .param(subtotal).param(discount).param(shippingPrice).param(total)
                .param(promoCodeId).param(shippingMethodId).param(shippingAddressJson)
                .update();
    }

    public void insertOrderItem(String id, String orderId, String productId, String sellerId,
            String title, BigDecimal price, int quantity) {
        jdbc.sql("""
                        INSERT INTO order_items (id, order_id, product_id, seller_id, title, price, quantity)
                        VALUES (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, ?, ?)
                        """)
                .param(id).param(orderId).param(productId).param(sellerId).param(title).param(price).param(quantity)
                .update();
    }

    public void insertIdempotency(String key, String userId, String orderId) {
        jdbc.sql("INSERT INTO idempotency_keys (key, user_id, order_id) VALUES (?::uuid, ?::uuid, ?::uuid)")
                .param(key).param(userId).param(orderId)
                .update();
    }

    public Optional<String> idempotentOrder(String key, String userId) {
        return jdbc.sql("SELECT order_id FROM idempotency_keys WHERE key = ?::uuid AND user_id = ?::uuid")
                .param(key).param(userId)
                .query(String.class)
                .optional();
    }

    public Optional<OrderRow> findOrder(String id) {
        return jdbc.sql("SELECT * FROM orders WHERE id = ?::uuid")
                .param(id)
                .query(OrdersRepository::order)
                .optional();
    }

    public Paged<OrderRow> ordersByUser(String userId, int limit, int offset) {
        List<OrderRow> rows = jdbc.sql("SELECT * FROM orders WHERE user_id = ?::uuid ORDER BY created_at DESC LIMIT ? OFFSET ?")
                .param(userId).param(limit).param(offset)
                .query(OrdersRepository::order)
                .list();
        int total = jdbc.sql("SELECT count(*) FROM orders WHERE user_id = ?::uuid")
                .param(userId)
                .query(Integer.class).single();
        return new Paged(rows, total);
    }

    public Paged<OrderRow> ordersPage(int limit, int offset, String status) {
        String where = status == null ? "" : " WHERE status = ?::order_status";
        var q = jdbc.sql("SELECT * FROM orders" + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?");
        if (status != null) q = q.param(status);
        List<OrderRow> rows = q.param(limit).param(offset).query(OrdersRepository::order).list();
        var cq = jdbc.sql("SELECT count(*) FROM orders" + where);
        if (status != null) cq = cq.param(status);
        int total = cq.query(Integer.class).single();
        return new Paged(rows, total);
    }

    public void updateStatus(String id, String status) {
        jdbc.sql("UPDATE orders SET status = ?::order_status, updated_at = now() WHERE id = ?::uuid")
                .param(status).param(id)
                .update();
    }

    public List<OrderItemRow> itemsByOrder(String orderId) {
        // в order_items нет created_at — порядок вставки детерминируем id
        return jdbc.sql("SELECT * FROM order_items WHERE order_id = ?::uuid ORDER BY id ASC")
                .param(orderId)
                .query((rs, i) -> new OrderItemRow(
                        rs.getString("id"), rs.getString("order_id"), rs.getString("product_id"),
                        rs.getString("seller_id"), rs.getString("title"), rs.getBigDecimal("price"), rs.getInt("quantity")))
                .list();
    }

    /** Продажи продавца: позиции чужих заказов по своим товарам (GET /seller/order-items). */
    public Paged<OrderItemRow> orderItemsBySeller(String sellerId, int limit, int offset) {
        List<OrderItemRow> rows = jdbc.sql("""
                        SELECT oi.* FROM order_items oi WHERE oi.seller_id = ?::uuid ORDER BY oi.id ASC LIMIT ? OFFSET ?
                        """)
                .param(sellerId).param(limit).param(offset)
                .query((rs, i) -> new OrderItemRow(
                        rs.getString("id"), rs.getString("order_id"), rs.getString("product_id"),
                        rs.getString("seller_id"), rs.getString("title"), rs.getBigDecimal("price"), rs.getInt("quantity")))
                .list();
        int total = jdbc.sql("SELECT count(*) FROM order_items WHERE seller_id = ?::uuid")
                .param(sellerId)
                .query(Integer.class).single();
        return new Paged(rows, total);
    }

    private static OrderRow order(ResultSet rs, int i) throws SQLException {
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

    private static ShippingMethodRow shipping(ResultSet rs, int i) throws SQLException {
        return new ShippingMethodRow(rs.getString("id"), rs.getString("code"), rs.getString("name"),
                rs.getBigDecimal("price"), rs.getInt("eta_days"));
    }

    private static PromoRow promo(ResultSet rs, int i) throws SQLException {
        return new PromoRow(rs.getString("id"), rs.getString("code"), rs.getString("type"),
                rs.getBigDecimal("value"), rs.getBigDecimal("min_subtotal"),
                rs.getObject("max_uses", Integer.class), rs.getInt("used_count"),
                rs.getObject("expires_at", OffsetDateTime.class), rs.getBoolean("active"));
    }
}
