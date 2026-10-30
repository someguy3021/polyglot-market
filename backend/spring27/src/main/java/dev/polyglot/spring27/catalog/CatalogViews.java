package dev.polyglot.spring27.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Формы ответов каталога по контракту (Product, Category, ProductImage, SellerBrief). */
public final class CatalogViews {

    public static class CategoryView {
        public final String id;
        public final String slug;
        public final String name;
        public final String parentId;

        public CategoryView(String id, String slug, String name, String parentId) {
            this.id = id;
            this.slug = slug;
            this.name = name;
            this.parentId = parentId;
        }
    }

    public static class ImageView {
        public final String id;
        public final String url;
        public final String thumbUrl;
        public final boolean isPrimary;

        public ImageView(String id, String url, String thumbUrl, boolean isPrimary) {
            this.id = id;
            this.url = url;
            this.thumbUrl = thumbUrl;
            this.isPrimary = isPrimary;
        }
    }

    public static class SellerBriefView {
        public final String id;
        public final String shopName;

        public SellerBriefView(String id, String shopName) {
            this.id = id;
            this.shopName = shopName;
        }
    }

    public static class ProductView {
        public final String id;
        public final String title;
        public final String slug;
        public final String description;
        public final BigDecimal price;
        public final int stock;
        public final String status;
        public final String rejectionReason;
        public final String categoryId;
        public final CategoryView category;
        public final SellerBriefView seller;
        public final List<ImageView> images;
        public final Instant createdAt;
        public final Instant updatedAt;

        public ProductView(String id, String title, String slug, String description, BigDecimal price,
                int stock, String status, String rejectionReason, String categoryId, CategoryView category,
                SellerBriefView seller, List<ImageView> images, Instant createdAt, Instant updatedAt) {
            this.id = id;
            this.title = title;
            this.slug = slug;
            this.description = description;
            this.price = price;
            this.stock = stock;
            this.status = status;
            this.rejectionReason = rejectionReason;
            this.categoryId = categoryId;
            this.category = category;
            this.seller = seller;
            this.images = images;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
    }

    private CatalogViews() {
    }
}
