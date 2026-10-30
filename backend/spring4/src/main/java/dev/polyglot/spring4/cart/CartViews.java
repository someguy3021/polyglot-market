package dev.polyglot.spring4.cart;

import java.math.BigDecimal;
import java.util.List;

import dev.polyglot.spring4.catalog.CatalogViews.ImageView;

/** Формы корзины по контракту (Cart, CartItem). */
public final class CartViews {

    public record CartProductView(String id, String title, BigDecimal price, List<ImageView> images) {
    }

    public record CartItemView(String id, int quantity, CartProductView product, BigDecimal lineTotal) {
    }

    public record CartView(String id, List<CartItemView> items, BigDecimal subtotal) {
    }

    private CartViews() {
    }
}
