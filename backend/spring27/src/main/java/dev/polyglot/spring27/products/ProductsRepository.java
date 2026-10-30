package dev.polyglot.spring27.products;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import dev.polyglot.spring27.catalog.CatalogViews.CategoryView;

/**
 * Товары и картинки: единый SQL-репозиторий для каталога, корзины, заказов,
 * кабинета продавца, модерации и админки (одна общая схема, ADR-002).
 */
@Repository
public class ProductsRepository {

    public static class ProductRow {
        public final String id;
        public final String sellerId;
        public final String categoryId;
        public final String title;
        public final String slug;
        public final String description;
        public final BigDecimal price;
        public final int stock;
        public final String status;
        public final String rejectionReason;
        public final OffsetDateTime createdAt;
        public final OffsetDateTime updatedAt;

        public ProductRow(String id, String sellerId, String categoryId, String title, String slug,
                String description, BigDecimal price, int stock, String status, String rejectionReason,
                OffsetDateTime createdAt, OffsetDateTime updatedAt) {
            this.id = id;
            this.sellerId = sellerId;
            this.categoryId = categoryId;
            this.title = title;
            this.slug = slug;
            this.description = description;
            this.price = price;
            this.stock = stock;
            this.status = status;
            this.rejectionReason = rejectionReason;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
    }

    public static class ImageRow {
        public final String id;
        public final String productId;
        public final String key;
        public final String thumbKey;
        public final boolean isPrimary;

        public ImageRow(String id, String productId, String key, String thumbKey, boolean isPrimary) {
            this.id = id;
            this.productId = productId;
            this.key = key;
            this.thumbKey = thumbKey;
            this.isPrimary = isPrimary;
        }
    }

    public static class SellerRow {
        public final String id;
        public final String shopName;

        public SellerRow(String id, String shopName) {
            this.id = id;
            this.shopName = shopName;
        }
    }

    /** Связи товара для сериализации; url картинок строит сервис от urlBase. */
    public static class Relations {
        public final CategoryView category;
        public final SellerRow seller;
        public final List<ImageRow> images;

        public Relations(CategoryView category, SellerRow seller, List<ImageRow> images) {
            this.category = category;
            this.seller = seller;
            this.images = images;
        }
    }

    public static class Paged {
        public final List<ProductRow> rows;
        public final int total;

        public Paged(List<ProductRow> rows, int total) {
            this.rows = rows;
            this.total = total;
        }
    }

    private static final RowMapper<ProductRow> PRODUCT = new RowMapper<ProductRow>() {
        @Override
        public ProductRow mapRow(ResultSet rs, int i) throws SQLException {
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
    };

    private static final RowMapper<ImageRow> IMAGE = new RowMapper<ImageRow>() {
        @Override
        public ImageRow mapRow(ResultSet rs, int i) throws SQLException {
            return new ImageRow(rs.getString("id"), rs.getString("product_id"),
                    rs.getString("key"), rs.getString("thumb_key"), rs.getBoolean("is_primary"));
        }
    };

    private final JdbcTemplate jdbc;

    public ProductsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ---------- каталог (публичный, только approved) ----------

    public Paged page(int limit, int offset, String category, String seller, String q,
            BigDecimal priceMin, BigDecimal priceMax, String sort) {
        StringBuilder where = new StringBuilder(" WHERE p.status = 'approved'");
        List<Object> params = new ArrayList<Object>();
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
        String order;
        if ("oldest".equals(sort)) {
            order = " ORDER BY p.created_at ASC";
        } else if ("price_asc".equals(sort)) {
            order = " ORDER BY p.price ASC";
        } else if ("price_desc".equals(sort)) {
            order = " ORDER BY p.price DESC";
        } else {
            order = " ORDER BY p.created_at DESC"; // newest
        }
        List<Object> pageParams = new ArrayList<Object>(params);
        pageParams.add(limit);
        pageParams.add(offset);
        List<ProductRow> rows = jdbc.query("SELECT p.* FROM products p" + where + order + " LIMIT ? OFFSET ?",
                PRODUCT, pageParams.toArray());
        int total = jdbc.queryForObject("SELECT count(*) FROM products p" + where, Integer.class, params.toArray());
        return new Paged(rows, total);
    }

    public ProductRow findApprovedById(String id) {
        List<ProductRow> rows = jdbc.query("SELECT * FROM products WHERE id = ?::uuid AND status = 'approved'", PRODUCT, id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    // ---------- чтение по id ----------

    public ProductRow findById(String id) {
        List<ProductRow> rows = jdbc.query("SELECT * FROM products WHERE id = ?::uuid", PRODUCT, id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public List<ProductRow> findByIds(List<String> ids) {
        if (ids.isEmpty()) {
            return Collections.emptyList();
        }
        return jdbc.query("SELECT * FROM products WHERE id IN (" + placeholders(ids.size()) + ")", PRODUCT, ids.toArray());
    }

    /** Блокирующее чтение для чекаута (FOR UPDATE, паритет NestJS pessimistic_write). */
    public ProductRow lockById(String id) {
        List<ProductRow> rows = jdbc.query("SELECT * FROM products WHERE id = ?::uuid FOR UPDATE", PRODUCT, id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    // ---------- кабинет продавца ----------

    public Paged pageBySeller(String sellerId, int limit, int offset) {
        List<ProductRow> rows = jdbc.query(
                "SELECT * FROM products WHERE seller_id = ?::uuid ORDER BY created_at DESC LIMIT ? OFFSET ?",
                PRODUCT, sellerId, limit, offset);
        int total = jdbc.queryForObject("SELECT count(*) FROM products WHERE seller_id = ?::uuid",
                Integer.class, sellerId);
        return new Paged(rows, total);
    }

    public boolean slugExists(String slug) {
        return jdbc.queryForObject("SELECT count(*) FROM products WHERE slug = ?", Integer.class, slug) > 0;
    }

    public void insert(ProductRow p) {
        jdbc.update("INSERT INTO products (id, seller_id, category_id, title, slug, description, price, stock, status) "
                        + "VALUES (?::uuid, ?::uuid, ?::uuid, ?, ?, ?, ?, ?, ?::product_status)",
                p.id, p.sellerId, p.categoryId, p.title, p.slug, p.description, p.price, p.stock, p.status);
    }

    /** Правка продавца: одобренный товар возвращается в draft (контракт). */
    public void updateBySeller(ProductRow p) {
        jdbc.update("UPDATE products SET title = ?, description = ?, price = ?, stock = ?, category_id = ?::uuid, "
                        + "status = CASE WHEN status = 'approved' THEN 'draft' ELSE status END, updated_at = now() "
                        + "WHERE id = ?::uuid",
                p.title, p.description, p.price, p.stock, p.categoryId, p.id);
    }

    public void setStatus(String id, String status, String rejectionReason) {
        jdbc.update("UPDATE products SET status = ?::product_status, rejection_reason = ?, updated_at = now() WHERE id = ?::uuid",
                status, rejectionReason, id);
    }

    public Paged pagePending(int limit, int offset) {
        List<ProductRow> rows = jdbc.query(
                "SELECT * FROM products WHERE status = 'pending_moderation' ORDER BY created_at ASC LIMIT ? OFFSET ?",
                PRODUCT, limit, offset);
        int total = jdbc.queryForObject(
                "SELECT count(*) FROM products WHERE status = 'pending_moderation'", Integer.class);
        return new Paged(rows, total);
    }

    public void decrementStock(String id, int quantity) {
        jdbc.update("UPDATE products SET stock = stock - ?, updated_at = now() WHERE id = ?::uuid", quantity, id);
    }

    public void delete(String id) {
        jdbc.update("DELETE FROM products WHERE id = ?::uuid", id);
    }

    // ---------- связи ----------

    public Map<String, Relations> relations(List<ProductRow> products) {
        Map<String, Relations> out = new HashMap<String, Relations>();
        if (products.isEmpty()) {
            return out;
        }
        List<String> categoryIds = distinctIds(products, "categoryId");
        List<String> sellerIds = distinctIds(products, "sellerId");
        List<String> productIds = new ArrayList<String>();
        for (ProductRow p : products) {
            productIds.add(p.id);
        }

        final Map<String, CategoryView> cats = new HashMap<String, CategoryView>();
        jdbc.query("SELECT id, slug, name, parent_id FROM categories WHERE id IN (" + placeholders(categoryIds.size()) + ")",
                new RowMapper<Void>() {
                    @Override
                    public Void mapRow(ResultSet rs, int i) throws SQLException {
                        CategoryView c = new CategoryView(rs.getString("id"), rs.getString("slug"),
                                rs.getString("name"), rs.getString("parent_id"));
                        cats.put(c.id, c);
                        return null;
                    }
                }, categoryIds.toArray());

        final Map<String, SellerRow> sellers = new HashMap<String, SellerRow>();
        jdbc.query("SELECT u.id, COALESCE(sp.shop_name, u.name) AS shop_name FROM users u "
                        + "LEFT JOIN seller_profiles sp ON sp.user_id = u.id WHERE u.id IN ("
                        + placeholders(sellerIds.size()) + ")",
                new RowMapper<Void>() {
                    @Override
                    public Void mapRow(ResultSet rs, int i) throws SQLException {
                        SellerRow s = new SellerRow(rs.getString("id"), rs.getString("shop_name"));
                        sellers.put(s.id, s);
                        return null;
                    }
                }, sellerIds.toArray());

        final Map<String, List<ImageRow>> images = new HashMap<String, List<ImageRow>>();
        jdbc.query("SELECT * FROM product_images WHERE product_id IN (" + placeholders(productIds.size())
                        + ") ORDER BY sort ASC",
                new RowMapper<Void>() {
                    @Override
                    public Void mapRow(ResultSet rs, int i) throws SQLException {
                        ImageRow img = new ImageRow(rs.getString("id"), rs.getString("product_id"),
                                rs.getString("key"), rs.getString("thumb_key"), rs.getBoolean("is_primary"));
                        List<ImageRow> list = images.get(img.productId);
                        if (list == null) {
                            list = new ArrayList<ImageRow>();
                            images.put(img.productId, list);
                        }
                        list.add(img);
                        return null;
                    }
                }, productIds.toArray());

        for (ProductRow p : products) {
            CategoryView cat = cats.get(p.categoryId);
            SellerRow sel = sellers.get(p.sellerId);
            if (cat == null || sel == null) {
                throw new IllegalStateException("Product " + p.id + " has broken relations.");
            }
            List<ImageRow> imgs = images.get(p.id);
            out.put(p.id, new Relations(cat, sel, imgs == null ? Collections.<ImageRow>emptyList() : imgs));
        }
        return out;
    }

    // ---------- картинки ----------

    public List<ImageRow> imagesByProduct(String productId) {
        return jdbc.query("SELECT * FROM product_images WHERE product_id = ?::uuid ORDER BY sort ASC", IMAGE, productId);
    }

    public List<ImageRow> imagesByProducts(List<String> productIds) {
        if (productIds.isEmpty()) {
            return Collections.emptyList();
        }
        return jdbc.query("SELECT * FROM product_images WHERE product_id IN ("
                + placeholders(productIds.size()) + ") ORDER BY sort ASC", IMAGE, productIds.toArray());
    }

    public int countImages(String productId) {
        return jdbc.queryForObject("SELECT count(*) FROM product_images WHERE product_id = ?::uuid",
                Integer.class, productId);
    }

    public void insertImage(String id, String productId, String key, String thumbKey, boolean isPrimary, int sort) {
        jdbc.update("INSERT INTO product_images (id, product_id, key, thumb_key, is_primary, sort) "
                + "VALUES (?::uuid, ?::uuid, ?, ?, ?, ?)", id, productId, key, thumbKey, isPrimary, sort);
    }

    public ImageRow findImage(String imageId, String productId) {
        List<ImageRow> rows = jdbc.query(
                "SELECT * FROM product_images WHERE id = ?::uuid AND product_id = ?::uuid", IMAGE, imageId, productId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public void deleteImage(String imageId) {
        jdbc.update("DELETE FROM product_images WHERE id = ?::uuid", imageId);
    }

    // ---------- категории ----------

    public List<CategoryView> categories() {
        return jdbc.query("SELECT id, slug, name, parent_id FROM categories ORDER BY name ASC",
                new RowMapper<CategoryView>() {
                    @Override
                    public CategoryView mapRow(ResultSet rs, int i) throws SQLException {
                        return new CategoryView(rs.getString("id"), rs.getString("slug"),
                                rs.getString("name"), rs.getString("parent_id"));
                    }
                });
    }

    public boolean categoryExists(String id) {
        return jdbc.queryForObject("SELECT count(*) FROM categories WHERE id = ?::uuid", Integer.class, id) > 0;
    }

    // ---------- служебное ----------

    private static List<String> distinctIds(List<ProductRow> products, String field) {
        List<String> out = new ArrayList<String>();
        for (ProductRow p : products) {
            String value = "categoryId".equals(field) ? p.categoryId : p.sellerId;
            if (!out.contains(value)) {
                out.add(value);
            }
        }
        return out;
    }

    private static String placeholders(int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append('?');
        }
        return sb.toString();
    }
}
