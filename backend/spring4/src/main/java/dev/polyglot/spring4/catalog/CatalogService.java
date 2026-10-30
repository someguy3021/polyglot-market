package dev.polyglot.spring4.catalog;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import dev.polyglot.spring4.catalog.CatalogViews.CategoryView;
import dev.polyglot.spring4.catalog.CatalogViews.ImageView;
import dev.polyglot.spring4.catalog.CatalogViews.ProductView;
import dev.polyglot.spring4.common.ContractException;
import dev.polyglot.spring4.common.PageMeta;
import dev.polyglot.spring4.common.PageResponse;
import dev.polyglot.spring4.config.S3Props;
import dev.polyglot.spring4.products.ProductsRepository;

/** Публичный каталог: только approved-товары с связями. */
@Service
public class CatalogService {

    private final ProductsRepository products;
    private final S3Props s3;

    public CatalogService(ProductsRepository products, S3Props s3) {
        this.products = products;
        this.s3 = s3;
    }

    public PageResponse<ProductView> list(int page, int perPage, String category, String seller,
            String q, BigDecimal priceMin, BigDecimal priceMax, String sort) {
        ProductsRepository.Paged paged = products.page(perPage, (page - 1) * perPage, category, seller, q, priceMin, priceMax, sort);
        Map<String, ProductsRepository.Relations> rels = products.relations(paged.rows());
        List<ProductView> data = paged.rows().stream().map(p -> toView(p, rels.get(p.id()))).toList();
        return new PageResponse<>(data, PageMeta.of(paged.total(), page, perPage));
    }

    public ProductView one(String id) {
        ProductsRepository.ProductRow p = products.findApprovedById(parseUuid(id))
                .orElseThrow(() -> ContractException.notFound("Product not found."));
        return toView(p, products.relations(List.of(p)).get(p.id()));
    }

    public List<CategoryView> categories() {
        return products.categories();
    }

    public ProductView toView(ProductsRepository.ProductRow p, ProductsRepository.Relations rel) {
        String urlBase = s3.publicUrlBase();
        List<ImageView> images = rel.images().stream()
                .map(i -> new ImageView(i.id(), urlBase + "/" + i.key(),
                        i.thumbKey() == null ? null : urlBase + "/" + i.thumbKey(), i.isPrimary()))
                .toList();
        return new ProductView(
                p.id(), p.title(), p.slug(), p.description(), p.price(), p.stock(), p.status(),
                p.rejectionReason(), p.categoryId(), rel.category(),
                new CatalogViews.SellerBriefView(rel.seller().id(), rel.seller().shopName()),
                images, p.createdAt().toInstant(), p.updatedAt().toInstant());
    }

    public static String parseUuid(String raw) {
        try {
            return java.util.UUID.fromString(raw).toString();
        } catch (IllegalArgumentException e) {
            throw ContractException.notFound("Not found.");
        }
    }
}
