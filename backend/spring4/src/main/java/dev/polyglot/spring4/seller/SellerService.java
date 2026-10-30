package dev.polyglot.spring4.seller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.polyglot.spring4.catalog.CatalogService;
import dev.polyglot.spring4.catalog.CatalogViews.ImageView;
import dev.polyglot.spring4.catalog.CatalogViews.ProductView;
import dev.polyglot.spring4.common.ContractException;
import dev.polyglot.spring4.common.PageMeta;
import dev.polyglot.spring4.common.PageResponse;
import dev.polyglot.spring4.config.S3Props;
import dev.polyglot.spring4.orders.OrderViews.SellerOrderItemView;
import dev.polyglot.spring4.orders.OrdersRepository;
import dev.polyglot.spring4.products.ProductsRepository;
import dev.polyglot.spring4.products.ProductsRepository.ImageRow;
import dev.polyglot.spring4.products.ProductsRepository.ProductRow;

/** Кабинет продавца: товары, картинки в S3, продажи (паритет NestJS seller.service). */
@Service
public class SellerService {

    public record ProductInput(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min = 2, max = 200) String title,
            @jakarta.validation.constraints.Size(max = 5000) String description,
            @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.DecimalMin(value = "0", inclusive = false) BigDecimal price,
            @jakarta.validation.constraints.Min(0) Integer stock,
            @jakarta.validation.constraints.NotBlank String categoryId) {
    }

    public record UploadedView(String id, String url, String thumbUrl, boolean isPrimary) {
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
        if (!products.categoryExists(input.categoryId())) {
            throw ContractException.validation("The given data was invalid.",
                    Map.of("categoryId", List.of("The selected category is invalid.")));
        }
        ProductRow p = new ProductRow(UUID.randomUUID().toString(), sellerId, input.categoryId(),
                input.title(), uniqueSlug(input.title()), input.description() == null ? "" : input.description(),
                input.price(), input.stock() == null ? 0 : input.stock(), "draft", null, null, null);
        products.insert(p);
        return viewWithImages(products.findById(p.id()).orElseThrow(), products.imagesByProduct(p.id()));
    }

    @Transactional
    public ProductView update(String sellerId, String id, ProductInput input) {
        ProductRow p = own(sellerId, id);
        ProductRow updated = new ProductRow(p.id(), p.sellerId(), input.categoryId(), input.title(),
                p.slug(), input.description() == null ? "" : input.description(), input.price(),
                input.stock() == null ? 0 : input.stock(), p.status(), p.rejectionReason(), p.createdAt(), p.updatedAt());
        products.updateBySeller(updated); // одобренный возвращается в draft (контракт)
        return viewWithImages(products.findById(p.id()).orElseThrow(), products.imagesByProduct(p.id()));
    }

    @Transactional
    public ProductView submit(String sellerId, String id) {
        ProductRow p = own(sellerId, id);
        if (!"draft".equals(p.status()) && !"rejected".equals(p.status())) {
            throw ContractException.conflict("Only draft or rejected products can be submitted.");
        }
        products.setStatus(p.id(), "pending_moderation", null);
        return viewWithImages(products.findById(p.id()).orElseThrow(), products.imagesByProduct(p.id()));
    }

    @Transactional
    public UploadedView uploadImage(String sellerId, String id, String contentType, String filename, byte[] bytes) {
        ProductRow p = own(sellerId, id);
        if (bytes == null || bytes.length == 0) {
            throw ContractException.validation("The given data was invalid.", Map.of("file", List.of("file is required")));
        }
        List<String> allowed = List.of("image/jpeg", "image/png", "image/webp");
        if (contentType == null || !allowed.contains(contentType)) {
            throw ContractException.validation("The given data was invalid.",
                    Map.of("file", List.of("Only jpeg/png/webp images are allowed.")));
        }
        if (bytes.length > 5 * 1024 * 1024) {
            throw ContractException.validation("The given data was invalid.",
                    Map.of("file", List.of("Image exceeds 5 MB.")));
        }
        String uuid = UUID.randomUUID().toString();
        String ext = "image/png".equals(contentType) ? "png" : "image/webp".equals(contentType) ? "webp" : "jpg";
        String key = p.id() + "/" + uuid + "." + ext;
        String thumbKey = p.id() + "/" + uuid + "-thumb.png";
        byte[] thumb;
        try {
            thumb = thumbs.thumbnail(bytes);
        } catch (IllegalArgumentException e) {
            throw ContractException.validation("The given data was invalid.",
                    Map.of("file", List.of("Unsupported image data.")));
        }
        storage.put(key, bytes, contentType);
        storage.put(thumbKey, thumb, "image/png");
        int count = products.countImages(p.id());
        ImageRow image = new ImageRow(UUID.randomUUID().toString(), p.id(), key, thumbKey, count == 0);
        products.insertImage(image.id(), image.productId(), image.key(), image.thumbKey(), image.isPrimary(), count);
        String base = s3.publicUrlBase();
        return new UploadedView(image.id(), base + "/" + image.key(), base + "/" + image.thumbKey(), image.isPrimary());
    }

    @Transactional
    public void deleteImage(String sellerId, String id, String imageId) {
        ProductRow p = own(sellerId, id);
        ImageRow image = products.findImage(CatalogService.parseUuid(imageId), p.id())
                .orElseThrow(() -> ContractException.notFound("Image not found."));
        if (image.key() != null) storage.remove(image.key());
        if (image.thumbKey() != null) storage.remove(image.thumbKey());
        products.deleteImage(image.id());
    }

    public PageResponse<SellerOrderItemView> orderItems(String sellerId, int page, int perPage) {
        OrdersRepository.Paged<OrdersRepository.OrderItemRow> paged =
                orders.orderItemsBySeller(sellerId, perPage, (page - 1) * perPage);
        List<SellerOrderItemView> data = paged.rows().stream()
                .map(item -> {
                    var order = orders.findOrder(item.orderId()).orElseThrow();
                    return new SellerOrderItemView(item.id(), item.orderId(), order.status(),
                            item.title(), item.title(), item.price(), item.quantity(), order.createdAt().toInstant());
                })
                .toList();
        return new PageResponse<>(data, PageMeta.of(paged.total(), page, perPage));
    }

    // ---------- служебное ----------

    /** Чужой товар не раскрываем: как не найденный (паритет с Laravel). */
    private ProductRow own(String sellerId, String id) {
        ProductRow p = products.findById(CatalogService.parseUuid(id))
                .orElseThrow(() -> ContractException.notFound("Product not found."));
        if (!p.sellerId().equals(sellerId)) {
            throw ContractException.notFound("Product not found.");
        }
        return p;
    }

    /** Слаг из названия: [^a-z0-9] → '-', до 60 символов, суффикс -2/-3 при коллизии. */
    private String uniqueSlug(String title) {
        String base = title.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
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
        var rels = products.relations(paged.rows());
        List<ProductView> data = paged.rows().stream().map(p -> catalog.toView(p, rels.get(p.id()))).toList();
        return new PageResponse<>(data, PageMeta.of(paged.total(), page, perPage));
    }

    private ProductView viewWithImages(ProductRow p, List<ImageRow> images) {
        var rel = products.relations(List.of(p)).get(p.id());
        ProductView view = catalog.toView(p, rel);
        String base = s3.publicUrlBase();
        List<ImageView> views = images.stream()
                .map(i -> new ImageView(i.id(), base + "/" + i.key(),
                        i.thumbKey() == null ? null : base + "/" + i.thumbKey(), i.isPrimary()))
                .toList();
        return new ProductView(view.id(), view.title(), view.slug(), view.description(), view.price(), view.stock(),
                view.status(), view.rejectionReason(), view.categoryId(), view.category(), view.seller(), views,
                view.createdAt(), view.updatedAt());
    }
}
