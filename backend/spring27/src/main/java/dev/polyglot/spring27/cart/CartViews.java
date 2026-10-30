package dev.polyglot.spring27.cart;

import java.math.BigDecimal;
import java.util.List;

import dev.polyglot.spring27.catalog.CatalogViews.ImageView;

/** Формы корзины по контракту (Cart, CartItem). */
public final class CartViews {

    public static class CartProductView {
        public final String id;
        public final String title;
        public final BigDecimal price;
        public final List<ImageView> images;

        public CartProductView(String id, String title, BigDecimal price, List<ImageView> images) {
            this.id = id;
            this.title = title;
            this.price = price;
            this.images = images;
        }
    }

    public static class CartItemView {
        public final String id;
        public final int quantity;
        public final CartProductView product;
        public final BigDecimal lineTotal;

        public CartItemView(String id, int quantity, CartProductView product, BigDecimal lineTotal) {
            this.id = id;
            this.quantity = quantity;
            this.product = product;
            this.lineTotal = lineTotal;
        }
    }

    public static class CartView {
        public final String id;
        public final List<CartItemView> items;
        public final BigDecimal subtotal;

        public CartView(String id, List<CartItemView> items, BigDecimal subtotal) {
            this.id = id;
            this.items = items;
            this.subtotal = subtotal;
        }
    }

    private CartViews() {
    }
}
