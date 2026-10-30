package dev.polyglot.spring4.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Формы ответов каталога по контракту (Product, Category, ProductImage, SellerBrief). */
public final class CatalogViews {

    public record CategoryView(String id, String slug, String name, String parentId) {
    }

    public record ImageView(String id, String url, String thumbUrl, boolean isPrimary) {
    }

    public record SellerBriefView(String id, String shopName) {
    }

    public record ProductView(
            String id,
            String title,
            String slug,
            String description,
            BigDecimal price,
            int stock,
            String status,
            String rejectionReason,
            String categoryId,
            CategoryView category,
            SellerBriefView seller,
            List<ImageView> images,
            Instant createdAt,
            Instant updatedAt) {
    }

    private CatalogViews() {
    }
}
