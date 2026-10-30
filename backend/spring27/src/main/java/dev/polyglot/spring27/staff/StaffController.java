package dev.polyglot.spring27.staff;

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

import dev.polyglot.spring27.auth.UserView;
import dev.polyglot.spring27.catalog.CatalogViews.ProductView;
import dev.polyglot.spring27.common.PageResponse;
import dev.polyglot.spring27.common.Roles;
import dev.polyglot.spring27.orders.OrderViews.OrderView;

import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/** Модерация (moderator) и админка (admin) — ролевые эндпоинты. */
@RestController
@Validated
public class StaffController {

    private final StaffService staff;

    public StaffController(StaffService staff) {
        this.staff = staff;
    }

    // ---------- модератор ----------

    @GetMapping("/moderator/queue")
    @Roles("moderator")
    public PageResponse<ProductView> queue(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int perPage) {
        return staff.queue(page, perPage);
    }

    @PostMapping("/moderator/products/{id}/approve")
    @Roles("moderator")
    public ProductView approve(@PathVariable String id) {
        return staff.approve(id);
    }

    @PostMapping("/moderator/products/{id}/reject")
    @Roles("moderator")
    public ProductView reject(@PathVariable String id, @Valid @RequestBody StaffService.RejectInput body) {
        return staff.reject(id, body.reason);
    }

    // ---------- админ ----------

    @GetMapping("/admin/orders")
    @Roles("admin")
    public PageResponse<OrderView> orders(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int perPage,
            @RequestParam(required = false) @Pattern(regexp = "new|paid|shipped|done|cancelled") String status) {
        return staff.orders(page, perPage, status);
    }

    @PutMapping("/admin/orders/{id}/status")
    @Roles("admin")
    public OrderView changeStatus(@PathVariable String id, @Valid @RequestBody StatusInput body) {
        return staff.changeStatus(id, body.status);
    }

    public static class StatusInput {
        @NotBlank
        @Pattern(regexp = "new|paid|shipped|done|cancelled")
        public String status;
    }

    @GetMapping("/admin/users")
    @Roles("admin")
    public PageResponse<UserView> users(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int perPage,
            @RequestParam(required = false) @Pattern(regexp = "buyer|seller|moderator|admin") String role) {
        return staff.users(page, perPage, role);
    }

    @PutMapping("/admin/users/{id}/role")
    @Roles("admin")
    public UserView updateRole(@PathVariable String id, @Valid @RequestBody StaffService.RoleInput body) {
        return staff.updateRole(id, body.role);
    }

    @GetMapping("/admin/promo-codes")
    @Roles("admin")
    public List<StaffViews.PromoCodeView> promoCodes() {
        return staff.promoCodes();
    }

    @PostMapping("/admin/promo-codes")
    @Roles("admin")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffViews.PromoCodeView createPromoCode(@Valid @RequestBody StaffService.PromoCodeInput body) {
        return staff.createPromoCode(body);
    }

    @DeleteMapping("/admin/products/{id}")
    @Roles("admin")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable String id) {
        staff.deleteProduct(id);
    }
}
