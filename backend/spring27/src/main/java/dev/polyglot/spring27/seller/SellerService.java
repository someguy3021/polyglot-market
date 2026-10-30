package dev.polyglot.spring27.seller;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.polyglot.spring27.catalog.CatalogService;
import dev.polyglot.spring27.catalog.CatalogViews.ImageView;
import dev.polyglot.spring27.catalog.CatalogViews.ProductView;
import dev.polyglot.spring27.common.ContractException;
import dev.polyglot.spring27.common.PageMeta;
import dev.polyglot.spring27.common.PageResponse;
import dev.polyglot.spring27.config.S3Props;
import dev.polyglot.spring27.orders.OrderViews.SellerOrderItemView;
import dev.polyglot.spring27.orders.OrdersRepository;
import dev.polyglot.spring27.orders.OrdersRepository.OrderItemRow;
import dev.polyglot.spring27.orders.OrdersRepository.OrderRow;
import dev.polyglot.spring27.products.ProductsRepository;
import dev.polyglot.spring27.products.ProductsRepository.ImageRow;
import dev.polyglot.spring27.products.ProductsRepository.ProductRow;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/** Кабинет продавца: товары, картинки в S3, продажи (паритет NestJS seller.service). */
@Service
public class SellerService {

    public static class ProductInput {
        @NotBlank
        @Size(min = 2, max = 200)
        public String title;

        @Size(max = 5000)
        public String description;

        @NotNull
        @DecimalMin(value = "0", inclusive = false)
        public BigDecimal price;

        @Min(0)
        public Integer stock;

        @NotBlank
        public String categoryId;
    }

    public static class UploadedView {
        public final String id;
        public final String url;
        public final String thumbUrl;
        public final boolean isPrimary;

        public UploadedView(String id, String url, String thumbUrl, boolean isPrimary) {
            this.id = id;
            this.url = url;
            this.thumbUrl = thumbUrl;
            this.isPrimary = isPrimary;
        }
    }

    private final ProductsRepository products;
    private final OrdersRepository orders;
    private final CatalogService catalog;
    private final S3Storage storage;
    private final ImageThumbs thumbs;
    private final S3Props s3;

    public SellerService(ProductsRepository products, OrdersRepository orders, CatalogService catalog,
            S3Storage storage, ImageThumbs thumbs, S3Props s3) {
        this.products = products;
        this.orders = orders;
        this.catalog = catalog;
        this.storage = storage;
        this.thumbs = thumbs;
        this.s3 = s3;
    }

    public PageResponse<ProductView> listMine(String sellerId, int page, int perPage) {
        ProductsRepository.Paged paged = products.pageBySeller(sellerId, perPage, (page - 1) * perPage);
        return serializePage(paged, page, perPage);
    }

    @Transactional
    public ProductView create(String sellerId, ProductInput input) {
        if (!products.categoryExists(input.categoryId)) {
            Map<String, List<String>> details = new HashMap<String, List<String>>();
            details.put("categoryId", Collections.singletonList("The selected category is invalid."));
            throw ContractException.validation("The given data was invalid.", details);
        }
        ProductRow p = new ProductRow(UUID.randomUUID().toString(), sellerId, input.categoryId,
                input.title, uniqueSlug(input.title), input.description == null ? "" : input.description,
                input.price, input.stock == null ? 0 : input.stock, "draft", null, null, null);
        products.insert(p);
        return viewWithImages(products.findById(p.id), products.imagesByProduct(p.id));
    }

    @Transactional
    public ProductView update(String sellerId, String id, ProductInput input) {
        ProductRow p = own(sellerId, id);
        ProductRow updated = new ProductRow(p.id, p.sellerId, input.categoryId, input.title,
                p.slug, input.description == null ? "" : input.description, input.price,
                input.stock == null ? 0 : input.stock, p.status, p.rejectionReason, p.createdAt, p.updatedAt);
        products.updateBySeller(updated); // одобренный возвращается в draft (контракт)
        return viewWithImages(products.findById(p.id), products.imagesByProduct(p.id));
    }

    @Transactional
    public ProductView submit(String sellerId, String id) {
        ProductRow p = own(sellerId, id);
        if (!"draft".equals(p.status) && !"rejected".equals(p.status)) {
            throw ContractException.conflict("Only draft or rejected products can be submitted.");
        }
        products.setStatus(p.id, "pending_moderation", null);
        return viewWithImages(products.findById(p.id), products.imagesByProduct(p.id));
    }

    @Transactional
    public UploadedView uploadImage(String sellerId, String id, String contentType, byte[] bytes) {
        ProductRow p = own(sellerId, id);
        if (bytes == null || bytes.length == 0) {
            Map<String, List<String>> d = new HashMap<String, List<String>>();
            d.put("file", Collections.singletonList("file is required"));
            throw ContractException.validation("The given data was invalid.", d);
        }
        List<String> allowed = Arrays.asList("image/jpeg", "image/png", "image/webp");
        if (contentType == null || !allowed.contains(contentType)) {
            Map<String, List<String>> d = new HashMap<String, List<String>>();
            d.put("file", Collections.singletonList("Only jpeg/png/webp images are allowed."));
            throw ContractException.validation("The given data was invalid.", d);
        }
        if (bytes.length > 5 * 1024 * 1024) {
            Map<String, List<String>> d = new HashMap<String, List<String>>();
            d.put("file", Collections.singletonList("Image exceeds 5 MB."));
            throw ContractException.validation("The given data was invalid.", d);
        }
        String uuid = UUID.randomUUID().toString();
        String ext = "image/png".equals(contentType) ? "png"
                : "image/webp".equals(contentType) ? "webp" : "jpg";
        String key = p.id + "/" + uuid + "." + ext;
        String thumbKey = p.id + "/" + uuid + "-thumb.png";
        byte[] thumb;
        try {
            thumb = thumbs.thumbnail(bytes);
        } catch (IllegalArgumentException e) {
            Map<String, List<String>> d = new HashMap<String, List<String>>();
            d.put("file", Collections.singletonList("Unsupported image data."));
            throw ContractException.validation("The given data was invalid.", d);
        }
        storage.put(key, bytes, contentType);
        storage.put(thumbKey, thumb, "image/png");
        int count = products.countImages(p.id);
        ImageRow image = new ImageRow(UUID.randomUUID().toString(), p.id, key, thumbKey, count == 0);
        products.insertImage(image.id, image.productId, image.key, image.thumbKey, image.isPrimary, count);
        String base = s3.publicUrlBase();
        return new UploadedView(image.id, base + "/" + image.key, base + "/" + image.thumbKey, image.isPrimary);
    }

    @Transactional
    public void deleteImage(String sellerId, String id, String imageId) {
        ProductRow p = own(sellerId, id);
        ImageRow image = products.findImage(CatalogService.parseUuid(imageId), p.id);
        if (image == null) {
            throw ContractException.notFound("Image not found.");
        }
        if (image.key != null) {
            storage.remove(image.key);
        }
        if (image.thumbKey != null) {
            storage.remove(image.thumbKey);
        }
        products.deleteImage(image.id);
    }

    public PageResponse<SellerOrderItemView> orderItems(String sellerId, int page, int perPage) {
        List<OrderItemRow> rows = orders.orderItemsBySeller(sellerId, perPage, (page - 1) * perPage);
        int total = orders.countOrderItemsBySeller(sellerId);
        List<SellerOrderItemView> data = new ArrayList<SellerOrderItemView>();
        for (OrderItemRow item : rows) {
            OrderRow order = orders.findOrder(item.orderId);
            data.add(new SellerOrderItemView(item.id, item.orderId, order.status,
                    item.title, item.title, item.price, item.quantity, order.createdAt.toInstant()));
        }
        return new PageResponse<SellerOrderItemView>(data, PageMeta.of(total, page, perPage));
    }

    // ---------- служебное ----------

    /** Чужой товар не раскрываем: как не найденный (паритет с Laravel). */
    private ProductRow own(String sellerId, String id) {
        ProductRow p = products.findById(CatalogService.parseUuid(id));
        if (p == null || !p.sellerId.equals(sellerId)) {
            throw ContractException.notFound("Product not found.");
        }
        return p;
    }

    /** Слаг из названия: [^a-z0-9] → '-', до 60 символов, суффикс -2/-3 при коллизии. */
    private String uniqueSlug(String title) {
        String base = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        if (base.length() > 60) {
            base = base.substring(0, 60).replaceAll("-+$", "");
        }
        String slug = base;
        int i = 2;
        while (products.slugExists(slug)) {
            slug = base + "-" + i++;
        }
        return slug;
    }

    private PageResponse<ProductView> serializePage(ProductsRepository.Paged paged, int page, int perPage) {
        Map<String, ProductsRepository.Relations> rels = products.relations(paged.rows);
        List<ProductView> data = new ArrayList<ProductView>();
        for (ProductRow p : paged.rows) {
            data.add(catalog.toView(p, rels.get(p.id)));
        }
        return new PageResponse<ProductView>(data, PageMeta.of(paged.total, page, perPage));
    }

    private ProductView viewWithImages(ProductRow p, List<ImageRow> images) {
        ProductsRepository.Relations rel = products.relations(Collections.singletonList(p)).get(p.id);
        ProductView view = catalog.toView(p, rel);
        String base = s3.publicUrlBase();
        List<ImageView> views = new ArrayList<ImageView>();
        for (ImageRow i : images) {
            views.add(new ImageView(i.id, base + "/" + i.key,
                    i.thumbKey == null ? null : base + "/" + i.thumbKey, i.isPrimary));
        }
        return new ProductView(view.id, view.title, view.slug, view.description, view.price, view.stock,
                view.status, view.rejectionReason, view.categoryId, view.category, view.seller, views,
                view.createdAt, view.updatedAt);
    }
}
