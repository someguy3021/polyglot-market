package dev.polyglot.spring4.catalog;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.polyglot.spring4.catalog.CatalogViews.CategoryView;
import dev.polyglot.spring4.catalog.CatalogViews.ProductView;
import dev.polyglot.spring4.common.PageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

@RestController
@Validated
public class CatalogController {

    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    public record CategoryList(List<CategoryView> data) {
    }

    @GetMapping("/products")
    public PageResponse<ProductView> list(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int perPage,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String seller,
            @RequestParam(required = false) String q,
            @RequestParam(name = "price_min", required = false) BigDecimal priceMin,
            @RequestParam(name = "price_max", required = false) BigDecimal priceMax,
            @RequestParam(defaultValue = "newest") @Pattern(regexp = "newest|oldest|price_asc|price_desc") String sort) {
        return catalog.list(page, perPage, category, seller, q, priceMin, priceMax, sort);
    }

    @GetMapping("/products/{id}")
    public ProductView one(@PathVariable String id) {
        return catalog.one(id);
    }

    @GetMapping("/categories")
    public CategoryList categories() {
        return new CategoryList(catalog.categories());
    }
}
