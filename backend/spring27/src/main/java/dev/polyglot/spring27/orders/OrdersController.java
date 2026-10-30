package dev.polyglot.spring27.orders;

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

import dev.polyglot.spring27.auth.UserRow;
import dev.polyglot.spring27.common.CurrentUser;
import dev.polyglot.spring27.common.PageResponse;
import dev.polyglot.spring27.orders.OrderViews.OrderView;
import dev.polyglot.spring27.orders.OrderViews.PromoValidation;
import dev.polyglot.spring27.orders.OrderViews.ShippingMethodView;
import dev.polyglot.spring27.orders.OrdersService.OrderInput;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.Max;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

@RestController
@Validated
public class OrdersController {

    public static class PromoInput {
        @NotBlank
        public String code;

        @NotNull
        public BigDecimal subtotal;
    }

    public static class ShippingMethodsList {
        public final List<ShippingMethodView> data;

        public ShippingMethodsList(List<ShippingMethodView> data) {
            this.data = data;
        }
    }

    private final OrdersService orders;

    public OrdersController(OrdersService orders) {
        this.orders = orders;
    }

    @PostMapping("/promo/validate")
    public PromoValidation validatePromo(@Valid @RequestBody PromoInput body) {
        return orders.validatePromo(body.code, body.subtotal);
    }

    @GetMapping("/shipping-methods")
    public ShippingMethodsList shippingMethods() {
        return new ShippingMethodsList(orders.shippingMethods());
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderView> create(@CurrentUser UserRow user,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody OrderInput body) {
        OrdersService.Created created = orders.create(user.id, idempotencyKey, body);
        return ResponseEntity.status(created.created ? HttpStatus.CREATED : HttpStatus.OK).body(created.view);
    }

    @GetMapping("/orders")
    public PageResponse<OrderView> mine(@CurrentUser UserRow user,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int perPage) {
        return orders.listMine(user.id, page, perPage);
    }

    @GetMapping("/orders/{id}")
    public OrderView one(@CurrentUser UserRow user, @PathVariable String id) {
        return orders.oneFor(user, id);
    }
}
