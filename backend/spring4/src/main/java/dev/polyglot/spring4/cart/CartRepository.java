package dev.polyglot.spring4.cart;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** SQL-доступ к carts/cart_items общей схемы. */
@Repository
public class CartRepository {

    public record CartRow(String id, String userId, String token, boolean converted) {
    }

    public record CartItemRow(String id, String cartId, String productId, int quantity) {
    }

    private final JdbcClient jdbc;

    public CartRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<CartRow> findById(String id) {
        return jdbc.sql("SELECT * FROM carts WHERE id = ?::uuid").param(id).query(CartRepository::cart).optional();
    }

    public Optional<CartRow> findByUserId(String userId) {
        return jdbc.sql("SELECT * FROM carts WHERE user_id = ?::uuid").param(userId).query(CartRepository::cart).optional();
    }

    public Optional<CartRow> findByToken(String token) {
        return jdbc.sql("SELECT * FROM carts WHERE token = ?::uuid").param(token).query(CartRepository::cart).optional();
    }

    /** Блокирующее чтение корзины для чекаута (FOR UPDATE). */
    public Optional<CartRow> lockByUserAndNotConverted(String userId) {
        return jdbc.sql("SELECT * FROM carts WHERE user_id = ?::uuid AND converted = false FOR UPDATE")
                .param(userId)
                .query(CartRepository::cart)
                .optional();
    }

    /** token обязателен по схеме (NOT NULL UNIQUE); для аккаунтных корзин он не публикуется. */
    public void insert(String id, String userId, String token) {
        jdbc.sql("INSERT INTO carts (id, user_id, token, converted) VALUES (?::uuid, ?::uuid, ?::uuid, false)")
                .param(id)
                .param(userId)
                .param(token)
                .update();
    }

    public void setConverted(String id, boolean converted) {
        jdbc.sql("UPDATE carts SET converted = ?, updated_at = now() WHERE id = ?::uuid")
                .param(converted)
                .param(id)
                .update();
    }

    public Optional<CartItemRow> findItem(String cartId, String itemId) {
        return jdbc.sql("SELECT * FROM cart_items WHERE id = ?::uuid AND cart_id = ?::uuid")
                .param(itemId)
                .param(cartId)
                .query(CartRepository::item)
                .optional();
    }

    public Optional<CartItemRow> findItemByProduct(String cartId, String productId) {
        return jdbc.sql("SELECT * FROM cart_items WHERE cart_id = ?::uuid AND product_id = ?::uuid")
                .param(cartId)
                .param(productId)
                .query(CartRepository::item)
                .optional();
    }

    public List<CartItemRow> itemsByCart(String cartId) {
        return jdbc.sql("SELECT * FROM cart_items WHERE cart_id = ?::uuid ORDER BY created_at ASC")
                .param(cartId)
                .query(CartRepository::item)
                .list();
    }

    public void insertItem(String id, String cartId, String productId, int quantity) {
        jdbc.sql("INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?::uuid, ?::uuid, ?::uuid, ?)")
                .param(id).param(cartId).param(productId).param(quantity)
                .update();
    }

    public void updateItemQuantity(String id, int quantity) {
        jdbc.sql("UPDATE cart_items SET quantity = ? WHERE id = ?::uuid")
                .param(quantity)
                .param(id)
                .update();
    }

    public void deleteItem(String id) {
        jdbc.sql("DELETE FROM cart_items WHERE id = ?::uuid").param(id).update();
    }

    public void deleteItemsOfCart(String cartId) {
        jdbc.sql("DELETE FROM cart_items WHERE cart_id = ?::uuid").param(cartId).update();
    }

    private static CartRow cart(java.sql.ResultSet rs, int i) throws java.sql.SQLException {
        return new CartRow(rs.getString("id"), rs.getString("user_id"), rs.getString("token"), rs.getBoolean("converted"));
    }

    private static CartItemRow item(java.sql.ResultSet rs, int i) throws java.sql.SQLException {
        return new CartItemRow(rs.getString("id"), rs.getString("cart_id"), rs.getString("product_id"), rs.getInt("quantity"));
    }
}
