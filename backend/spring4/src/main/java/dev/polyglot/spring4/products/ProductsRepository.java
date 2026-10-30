package dev.polyglot.spring4.products;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import dev.polyglot.spring4.catalog.CatalogViews.CategoryView;

/**
 * Товары и картинки: единый SQL-репозиторий для каталога, корзины, заказов,
 * кабинета продавца, модерации и админки (одна общая схема, ADR-002).
 */
@Repository
public class ProductsRepository {

    public record ProductRow(
            String id,
            String sellerId,
            String categoryId,
            String title,
            String slug,
            String description,
            BigDecimal price,
            int stock,
            String status,
            String rejectionReason,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {

        public static ProductRow of(ResultSet rs) throws SQLException {
            return new ProductRow(
                    rs.getString("id"),
                    rs.getString("seller_id"),
                    rs.getString("category_id"),
                    rs.getString("title"),
                    rs.getString("slug"),
                    rs.getString("description"),
                    rs.getBigDecimal("price"),
                    rs.getInt("stock"),
                    rs.getString("status"),
                    rs.getString("rejection_reason"),
                    rs.getObject("created_at", OffsetDateTime.class),
                    rs.getObject("updated_at", OffsetDateTime.class));
        }
    }

    public record ImageRow(String id, String productId, String key, String thumbKey, boolean isPrimary) {
    }

    public record SellerRow(String id, String shopName) {
    }

    /** Связи товара для сериализации; url картинок строит сервис от urlBase. */
    public record Relations(CategoryView category, SellerRow seller, List<ImageRow> images) {
    }

    public record Paged(List<ProductRow> rows, int total) {
    }

    private final JdbcClient jdbc;

    public ProductsRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // ---------- каталог (публичный, только approved) ----------

    public Paged page(int limit, int offset, String category, String seller, String q,
            BigDecimal priceMin, BigDecimal priceMax, String sort) {
        StringBuilder where = new StringBuilder(" WHERE p.status = 'approved'");
        List<Object> params = new ArrayList<>();
        if (category != null) {
            where.append(" AND p.category_id IN (SELECT id FROM categories WHERE slug = ?)");
            params.add(category);
        }
        if (seller != null) {
            where.append(" AND p.seller_id IN (SELECT user_id FROM seller_profiles WHERE shop_name = ?)");
            params.add(seller);
        }
        if (q != null) {
            where.append(" AND p.title ILIKE ?");
            params.add("%" + q + "%");
        }
        if (priceMin != null) {
            where.append(" AND p.price >= ?");
            params.add(priceMin);
        }
        if (priceMax != null) {
            where.append(" AND p.price <= ?");
            params.add(priceMax);
        }
        String order = switch (sort) {
            case "oldest" -> " ORDER BY p.created_at ASC";
            case "price_asc" -> " ORDER BY p.price ASC";
            case "price_desc" -> " ORDER BY p.price DESC";
            default -> " ORDER BY p.created_at DESC"; // newest
        };
        List<ProductRow> rows = jdbc.sql("SELECT p.* FROM products p" + where + order + " LIMIT ? OFFSET ?")
                .params(params)
                .param(limit)
                .param(offset)
                .query((rs, i) -> ProductRow.of(rs))
                .list();
        int total = countByWhere(where.toString(), params);
        return new Paged(rows, total);
    }

    public Optional<ProductRow> findApprovedById(String id) {
        return jdbc.sql("SELECT * FROM products WHERE id = ?::uuid AND status = 'approved'")
                .param(id)
                .query((rs, i) -> ProductRow.of(rs))
                .optional();
    }

    // ---------- чтение по id ----------

    public Optional<ProductRow> findById(String id) {
        return jdbc.sql("SELECT * FROM products WHERE id = ?::uuid")
                .param(id)
                .query((rs, i) -> ProductRow.of(rs))
                .optional();
    }

    public List<ProductRow> findByIds(List<String> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("SELECT * FROM products WHERE id IN (" + placeholders(ids.size()) + ")")
                .params(ids)
                .query((rs, i) -> ProductRow.of(rs))
                .list();
    }

    /** Блокирующее чтение для чекаута (FOR UPDATE, паритет NestJS pessimistic_write). */
    public Optional<ProductRow> lockById(String id) {
        return jdbc.sql("SELECT * FROM products WHERE id = ?::uuid FOR UPDATE")
                .param(id)
                .query((rs, i) -> ProductRow.of(rs))
                .optional();
    }

    // ---------- кабинет продавца ----------

    public Paged pageBySeller(String sellerId, int limit, int offset) {
        List<ProductRow> rows = jdbc.sql("""
                        SELECT * FROM products WHERE seller_id = ?::uuid ORDER BY created_at DESC LIMIT ? OFFSET ?
                        """)
                .param(sellerId)
                .param(limit)
                .param(offset)
                .query((rs, i) -> ProductRow.of(rs))
                .list();
        int total = jdbc.sql("SELECT count(*) FROM products WHERE seller_id = ?::uuid")
                .param(sellerId)
                .query(Integer.class)
                .single();
        return new Paged(rows, total);
    }

    public boolean slugExists(String slug) {
        return jdbc.sql("SELECT count(*) FROM products WHERE slug = ?").param(slug)
                .query(Integer.class).single() > 0;
    }

    public void insert(ProductRow p) {
        jdbc.sql("""
                        INSERT INTO products (id, seller_id, category_id, title, slug, description, price, stock, status)
                        VALUES (?::uuid, ?::uuid, ?::uuid, ?, ?, ?, ?, ?, ?::product_status)
                        """)
                .param(p.id()).param(p.sellerId()).param(p.categoryId())
                .param(p.title()).param(p.slug()).param(p.description())
                .param(p.price()).param(p.stock()).param(p.status())
                .update();
    }

    /** Правка продавца: одобренный товар возвращается в draft (контракт). */
    public void updateBySeller(ProductRow p) {
        jdbc.sql("""
                        UPDATE products
                        SET title = ?, description = ?, price = ?, stock = ?, category_id = ?::uuid,
                            status = CASE WHEN status = 'approved' THEN 'draft' ELSE status END,
                            updated_at = now()
                        WHERE id = ?::uuid
                        """)
                .param(p.title()).param(p.description()).param(p.price()).param(p.stock())
                .param(p.categoryId())
                .param(p.id())
                .update();
    }

    public void setStatus(String id, String status, String rejectionReason) {
        jdbc.sql("UPDATE products SET status = ?::product_status, rejection_reason = ?, updated_at = now() WHERE id = ?::uuid")
                .param(status)
                .param(rejectionReason)
                .param(id)
                .update();
    }

    public Paged pagePending(int limit, int offset) {
        List<ProductRow> rows = jdbc.sql("""
                        SELECT * FROM products WHERE status = 'pending_moderation' ORDER BY created_at ASC LIMIT ? OFFSET ?
                        """)
                .param(limit)
                .param(offset)
                .query((rs, i) -> ProductRow.of(rs))
                .list();
        int total = jdbc.sql("SELECT count(*) FROM products WHERE status = 'pending_moderation'")
                .query(Integer.class).single();
        return new Paged(rows, total);
    }

    public void decrementStock(String id, int quantity) {
        jdbc.sql("UPDATE products SET stock = stock - ?, updated_at = now() WHERE id = ?::uuid")
                .param(quantity)
                .param(id)
                .update();
    }

    public void delete(String id) {
        jdbc.sql("DELETE FROM products WHERE id = ?::uuid").param(id).update();
    }

    // ---------- связи ----------

    public Map<String, Relations> relations(List<ProductRow> products) {
        Map<String, Relations> out = new HashMap<>();
        if (products.isEmpty()) {
            return out;
        }
        List<String> categoryIds = products.stream().map(ProductRow::categoryId).distinct().toList();
        List<String> sellerIds = products.stream().map(ProductRow::sellerId).distinct().toList();
        List<String> productIds = products.stream().map(ProductRow::id).toList();

        Map<String, CategoryView> cats = new HashMap<>();
        jdbc.sql("SELECT id, slug, name, parent_id FROM categories WHERE id IN (" + placeholders(categoryIds.size()) + ")")
                .params(categoryIds)
                .query((rs, i) -> new CategoryView(rs.getString("id"), rs.getString("slug"),
                        rs.getString("name"), rs.getString("parent_id")))
                .list()
                .forEach(c -> cats.put(c.id(), c));

        Map<String, SellerRow> sellers = new HashMap<>();
        jdbc.sql("""
                        SELECT u.id, COALESCE(sp.shop_name, u.name) AS shop_name
                        FROM users u
                        LEFT JOIN seller_profiles sp ON sp.user_id = u.id
                        WHERE u.id IN (""" + placeholders(sellerIds.size()) + ")")
                .params(sellerIds)
                .query((rs, i) -> new SellerRow(rs.getString("id"), rs.getString("shop_name")))
                .list()
                .forEach(s -> sellers.put(s.id(), s));

        Map<String, List<ImageRow>> images = new HashMap<>();
        jdbc.sql("SELECT * FROM product_images WHERE product_id IN (" + placeholders(productIds.size()) + ") ORDER BY sort ASC")
                .params(productIds)
                .query((rs, i) -> new ImageRow(rs.getString("id"), rs.getString("product_id"),
                        rs.getString("key"), rs.getString("thumb_key"), rs.getBoolean("is_primary")))
                .list()
                .forEach(img -> images.computeIfAbsent(img.productId(), k -> new ArrayList<>()).add(img));

        for (ProductRow p : products) {
            CategoryView cat = cats.get(p.categoryId());
            SellerRow sel = sellers.get(p.sellerId());
            if (cat == null || sel == null) {
                throw new IllegalStateException("Product " + p.id() + " has broken relations.");
            }
            out.put(p.id(), new Relations(cat, sel, images.getOrDefault(p.id(), List.of())));
        }
        return out;
    }

    // ---------- картинки ----------

    public List<ImageRow> imagesByProduct(String productId) {
        return jdbc.sql("SELECT * FROM product_images WHERE product_id = ?::uuid ORDER BY sort ASC")
                .param(productId)
                .query((rs, i) -> imageOf(rs))
                .list();
    }

    public List<ImageRow> imagesByProducts(List<String> productIds) {
        if (productIds.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("SELECT * FROM product_images WHERE product_id IN (" + placeholders(productIds.size()) + ") ORDER BY sort ASC")
                .params(productIds)
                .query((rs, i) -> imageOf(rs))
                .list();
    }

    public int countImages(String productId) {
        return jdbc.sql("SELECT count(*) FROM product_images WHERE product_id = ?::uuid")
                .param(productId)
                .query(Integer.class).single();
    }

    public void insertImage(String id, String productId, String key, String thumbKey, boolean isPrimary, int sort) {
        jdbc.sql("""
                        INSERT INTO product_images (id, product_id, key, thumb_key, is_primary, sort)
                        VALUES (?::uuid, ?::uuid, ?, ?, ?, ?)
                        """)
                .param(id).param(productId).param(key).param(thumbKey).param(isPrimary).param(sort)
                .update();
    }

    public Optional<ImageRow> findImage(String imageId, String productId) {
        return jdbc.sql("SELECT * FROM product_images WHERE id = ?::uuid AND product_id = ?::uuid")
                .param(imageId)
                .param(productId)
                .query((rs, i) -> imageOf(rs))
                .optional();
    }

    public void deleteImage(String imageId) {
        jdbc.sql("DELETE FROM product_images WHERE id = ?::uuid").param(imageId).update();
    }

    // ---------- категории ----------

    public List<CategoryView> categories() {
        return jdbc.sql("SELECT id, slug, name, parent_id FROM categories ORDER BY name ASC")
                .query((rs, i) -> new CategoryView(rs.getString("id"), rs.getString("slug"),
                        rs.getString("name"), rs.getString("parent_id")))
                .list();
    }

    public boolean categoryExists(String id) {
        return jdbc.sql("SELECT count(*) FROM categories WHERE id = ?::uuid")
                .param(id)
                .query(Integer.class)
                .single() > 0;
    }

    // ---------- служебное ----------

    private int countByWhere(String where, List<Object> params) {
        return jdbc.sql("SELECT count(*) FROM products p" + where)
                .params(params)
                .query(Integer.class)
                .single();
    }

    private static ImageRow imageOf(ResultSet rs) throws SQLException {
        return new ImageRow(rs.getString("id"), rs.getString("product_id"),
                rs.getString("key"), rs.getString("thumb_key"), rs.getBoolean("is_primary"));
    }

    private static String placeholders(int n) {
        return String.join(", ", java.util.Collections.nCopies(n, "?"));
    }
}
