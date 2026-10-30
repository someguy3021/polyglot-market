package dev.polyglot.spring4.seller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import dev.polyglot.spring4.auth.UserRow;
import dev.polyglot.spring4.catalog.CatalogViews.ProductView;
import dev.polyglot.spring4.common.CurrentUser;
import dev.polyglot.spring4.common.PageResponse;
import dev.polyglot.spring4.common.Roles;
import dev.polyglot.spring4.orders.OrderViews.SellerOrderItemView;
import jakarta.validation.Valid;

/** Кабинет продавца: роль seller (проверка роли — как в NestJS-гарду). */
@RestController
@Validated
@Roles("seller")
public class SellerController {

    private final SellerService seller;

    public SellerController(SellerService seller) {
        this.seller = seller;
    }

    @GetMapping("/seller/products")
    public PageResponse<ProductView> list(@CurrentUser UserRow user,
            @RequestParam(defaultValue = "1") @jakarta.validation.constraints.Min(1) int page,
            @RequestParam(defaultValue = "20") @jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(100) int perPage) {
        return seller.listMine(user.id(), page, perPage);
    }

    @PostMapping("/seller/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductView create(@CurrentUser UserRow user, @Valid @RequestBody SellerService.ProductInput body) {
        return seller.create(user.id(), body);
    }

    @PutMapping("/seller/products/{id}")
    public ProductView update(@CurrentUser UserRow user, @PathVariable String id,
            @Valid @RequestBody SellerService.ProductInput body) {
        return seller.update(user.id(), id, body);
    }

    @PostMapping("/seller/products/{id}/submit")
    public ProductView submit(@CurrentUser UserRow user, @PathVariable String id) {
        return seller.submit(user.id(), id);
    }

    @PostMapping("/seller/products/{id}/images")
    @ResponseStatus(HttpStatus.CREATED)
    public SellerService.UploadedView uploadImage(@CurrentUser UserRow user, @PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        try {
            return seller.uploadImage(user.id(), id, file.getContentType(), file.getOriginalFilename(), file.getBytes());
        } catch (java.io.IOException e) {
            throw new IllegalStateException("upload read failed", e);
        }
    }

    @DeleteMapping("/seller/products/{id}/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteImage(@CurrentUser UserRow user, @PathVariable String id, @PathVariable String imageId) {
        seller.deleteImage(user.id(), id, imageId);
    }

    @GetMapping("/seller/order-items")
    public PageResponse<SellerOrderItemView> orderItems(@CurrentUser UserRow user,
            @RequestParam(defaultValue = "1") @jakarta.validation.constraints.Min(1) int page,
            @RequestParam(defaultValue = "20") @jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(100) int perPage) {
        return seller.orderItems(user.id(), page, perPage);
    }
}
