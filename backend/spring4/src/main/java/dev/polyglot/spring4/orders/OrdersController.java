package dev.polyglot.spring4.orders;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.polyglot.spring4.auth.UserRow;
import dev.polyglot.spring4.common.CurrentUser;
import dev.polyglot.spring4.common.PageResponse;
import dev.polyglot.spring4.orders.OrdersService.AddressInput;
import dev.polyglot.spring4.orders.OrdersService.OrderInput;
import dev.polyglot.spring4.orders.OrderViews.OrderView;
import dev.polyglot.spring4.orders.OrderViews.PromoValidation;
import dev.polyglot.spring4.orders.OrderViews.ShippingMethodView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@RestController
@Validated
public class OrdersController {

    public record PromoInput(@NotBlank String code, @NotNull BigDecimal subtotal) {
    }

    public record StatusInput(@NotBlank @Pattern(regexp = "new|paid|shipped|done|cancelled") String status) {
    }

    private final OrdersService orders;

    public OrdersController(OrdersService orders) {
        this.orders = orders;
    }

    @PostMapping("/promo/validate")
    public PromoValidation validatePromo(@Valid @RequestBody PromoInput body) {
        return orders.validatePromo(body.code(), body.subtotal());
    }

    @GetMapping("/shipping-methods")
    public ShippingMethodsList shippingMethods() {
        return new ShippingMethodsList(orders.shippingMethods());
    }

    public record ShippingMethodsList(List<ShippingMethodView> data) {
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderView> create(@CurrentUser UserRow user,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody OrderBody body) {
        OrdersService.Created created = orders.create(user.id(), idempotencyKey,
                new OrderInput(body.shippingMethodCode(), body.promoCode(), body.shippingAddress()));
        return ResponseEntity.status(created.created() ? HttpStatus.CREATED : HttpStatus.OK).body(created.view());
    }

    public record OrderBody(
            @NotBlank String shippingMethodCode,
            String promoCode,
            @NotNull @Valid AddressInput shippingAddress) {
    }

    @GetMapping("/orders")
    public PageResponse<OrderView> mine(@CurrentUser UserRow user,
            @RequestParam(defaultValue = "1") @jakarta.validation.constraints.Min(1) int page,
            @RequestParam(defaultValue = "20") @jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(100) int perPage) {
        return orders.listMine(user.id(), page, perPage);
    }

    @GetMapping("/orders/{id}")
    public OrderView one(@CurrentUser UserRow user, @PathVariable String id) {
        return orders.oneFor(user, id);
    }
}
