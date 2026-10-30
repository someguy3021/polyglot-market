package dev.polyglot.spring27.cart;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/** SQL-доступ к carts/cart_items общей схемы. */
@Repository
public class CartRepository {

    public static class CartRow {
        public final String id;
        public final String userId;
        public final String token;
        public final boolean converted;

        public CartRow(String id, String userId, String token, boolean converted) {
            this.id = id;
            this.userId = userId;
            this.token = token;
            this.converted = converted;
        }
    }

    public static class CartItemRow {
        public final String id;
        public final String cartId;
        public final String productId;
        public final int quantity;

        public CartItemRow(String id, String cartId, String productId, int quantity) {
            this.id = id;
            this.cartId = cartId;
            this.productId = productId;
            this.quantity = quantity;
        }
    }

    private static final RowMapper<CartRow> CART = new RowMapper<CartRow>() {
        @Override
        public CartRow mapRow(ResultSet rs, int i) throws SQLException {
            return new CartRow(rs.getString("id"), rs.getString("user_id"),
                    rs.getString("token"), rs.getBoolean("converted"));
        }
    };

    private static final RowMapper<CartItemRow> ITEM = new RowMapper<CartItemRow>() {
        @Override
        public CartItemRow mapRow(ResultSet rs, int i) throws SQLException {
            return new CartItemRow(rs.getString("id"), rs.getString("cart_id"),
                    rs.getString("product_id"), rs.getInt("quantity"));
        }
    };

    private final JdbcTemplate jdbc;

    public CartRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public CartRow findById(String id) {
        return single(jdbc.query("SELECT * FROM carts WHERE id = ?::uuid", CART, id));
    }

    public CartRow findByUserId(String userId) {
        return single(jdbc.query("SELECT * FROM carts WHERE user_id = ?::uuid", CART, userId));
    }

    public CartRow findByToken(String token) {
        return single(jdbc.query("SELECT * FROM carts WHERE token = ?::uuid", CART, token));
    }

    /** Блокирующее чтение корзины для чекаута (FOR UPDATE). */
    public CartRow lockByUserAndNotConverted(String userId) {
        return single(jdbc.query(
                "SELECT * FROM carts WHERE user_id = ?::uuid AND converted = false FOR UPDATE", CART, userId));
    }

    /** token обязателен по схеме (NOT NULL UNIQUE); для аккаунтных корзин он не публикуется. */
    public void insert(String id, String userId, String token) {
        jdbc.update("INSERT INTO carts (id, user_id, token, converted) VALUES (?::uuid, ?::uuid, ?::uuid, false)",
                id, userId, token);
    }

    public void setConverted(String id, boolean converted) {
        jdbc.update("UPDATE carts SET converted = ?, updated_at = now() WHERE id = ?::uuid", converted, id);
    }

    public CartItemRow findItem(String cartId, String itemId) {
        return single(jdbc.query("SELECT * FROM cart_items WHERE id = ?::uuid AND cart_id = ?::uuid",
                ITEM, itemId, cartId));
    }

    public CartItemRow findItemByProduct(String cartId, String productId) {
        return single(jdbc.query("SELECT * FROM cart_items WHERE cart_id = ?::uuid AND product_id = ?::uuid",
                ITEM, cartId, productId));
    }

    public List<CartItemRow> itemsByCart(String cartId) {
        return jdbc.query("SELECT * FROM cart_items WHERE cart_id = ?::uuid ORDER BY created_at ASC", ITEM, cartId);
    }

    public void insertItem(String id, String cartId, String productId, int quantity) {
        jdbc.update("INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?::uuid, ?::uuid, ?::uuid, ?)",
                id, cartId, productId, quantity);
    }

    public void updateItemQuantity(String id, int quantity) {
        jdbc.update("UPDATE cart_items SET quantity = ? WHERE id = ?::uuid", quantity, id);
    }

    public void deleteItem(String id) {
        jdbc.update("DELETE FROM cart_items WHERE id = ?::uuid", id);
    }

    public void deleteItemsOfCart(String cartId) {
        jdbc.update("DELETE FROM cart_items WHERE cart_id = ?::uuid", cartId);
    }

    private static <T> T single(List<T> rows) {
        return rows.isEmpty() ? null : rows.get(0);
    }
}
