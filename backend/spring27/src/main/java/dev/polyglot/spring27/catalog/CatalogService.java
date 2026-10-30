package dev.polyglot.spring27.catalog;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import dev.polyglot.spring27.catalog.CatalogViews.CategoryView;
import dev.polyglot.spring27.catalog.CatalogViews.ImageView;
import dev.polyglot.spring27.catalog.CatalogViews.ProductView;
import dev.polyglot.spring27.common.ContractException;
import dev.polyglot.spring27.common.PageMeta;
import dev.polyglot.spring27.common.PageResponse;
import dev.polyglot.spring27.config.S3Props;
import dev.polyglot.spring27.products.ProductsRepository;

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
        ProductsRepository.Paged paged = products.page(perPage, (page - 1) * perPage,
                category, seller, q, priceMin, priceMax, sort);
        Map<String, ProductsRepository.Relations> rels = products.relations(paged.rows);
        List<ProductView> data = new ArrayList<ProductView>();
        for (ProductsRepository.ProductRow p : paged.rows) {
            data.add(toView(p, rels.get(p.id)));
        }
        return new PageResponse<ProductView>(data, PageMeta.of(paged.total, page, perPage));
    }

    public ProductView one(String id) {
        ProductsRepository.ProductRow p = products.findApprovedById(parseUuid(id));
        if (p == null) {
            throw ContractException.notFound("Product not found.");
        }
        return toView(p, products.relations(Collections.singletonList(p)).get(p.id));
    }

    public List<CategoryView> categories() {
        return products.categories();
    }

    public ProductView toView(ProductsRepository.ProductRow p, ProductsRepository.Relations rel) {
        String urlBase = s3.publicUrlBase();
        List<ImageView> images = new ArrayList<ImageView>();
        for (ProductsRepository.ImageRow i : rel.images) {
            images.add(new ImageView(i.id, urlBase + "/" + i.key,
                    i.thumbKey == null ? null : urlBase + "/" + i.thumbKey, i.isPrimary));
        }
        return new ProductView(
                p.id, p.title, p.slug, p.description, p.price, p.stock, p.status,
                p.rejectionReason, p.categoryId, rel.category,
                new CatalogViews.SellerBriefView(rel.seller.id, rel.seller.shopName),
                images, p.createdAt.toInstant(), p.updatedAt.toInstant());
    }

    /** Разбор uuid из пути: не-uuid = не найдено (контракт 404). */
    public static String parseUuid(String raw) {
        try {
            return UUID.fromString(raw).toString();
        } catch (IllegalArgumentException e) {
            throw ContractException.notFound("Not found.");
        }
    }
}
