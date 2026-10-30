package dev.polyglot.spring4.cart;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import dev.polyglot.spring4.auth.UserRow;
import dev.polyglot.spring4.cart.CartService.Actor;
import dev.polyglot.spring4.cart.CartViews.CartView;
import dev.polyglot.spring4.common.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@RestController
public class CartController {

    public record CartItemInput(
            @NotBlank @Pattern(regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$") String productId,
            @NotNull @Min(1) @Max(99) Integer quantity) {
    }

    public record QuantityInput(@NotNull @Min(1) @Max(99) Integer quantity) {
    }

    public record MergeCartInput(
            @NotBlank @Pattern(regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$") String token) {
    }

    private final CartService cart;

    public CartController(CartService cart) {
        this.cart = cart;
    }

    @GetMapping("/cart")
    public CartView get(@CurrentUser(required = false) UserRow user,
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken) {
        return cart.view(cart.resolve(actor(user, cartToken)).cart().id());
    }

    @PostMapping("/cart/items")
    public ResponseEntity<CartView> addItem(@CurrentUser(required = false) UserRow user,
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken,
            @Valid @RequestBody CartItemInput body) {
        Actor actor = actor(user, cartToken);
        CartService.Added added = cart.addItem(actor, body.productId(), body.quantity());
        return ResponseEntity.status(HttpStatus.CREATED)
                .headers(h -> cart.cartHeaders(actor, added.createdToken()).forEach(h::set))
                .body(cart.view(added.cartId()));
    }

    @PatchMapping("/cart/items/{id}")
    public CartView updateItem(@CurrentUser(required = false) UserRow user,
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken,
            @PathVariable String id,
            @Valid @RequestBody QuantityInput body) {
        return cart.view(cart.setQuantity(actor(user, cartToken), id, body.quantity()));
    }

    @DeleteMapping("/cart/items/{id}")
    public CartView deleteItem(@CurrentUser(required = false) UserRow user,
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken,
            @PathVariable String id) {
        return cart.view(cart.removeItem(actor(user, cartToken), id));
    }

    @PostMapping("/cart/merge")
    public CartView merge(@CurrentUser UserRow user,
            @Valid @RequestBody MergeCartInput body) {
        return cart.view(cart.merge(user.id(), body.token()));
    }

    /** Паритет NestJS OptionalJwtAuthGuard: гость без токена допустим (создастся новая корзина). */
    private static Actor actor(UserRow user, String cartToken) {
        if (user != null) {
            return new Actor(user.id(), null);
        }
        if (cartToken != null && !cartToken.isBlank()) {
            return new Actor(null, cartToken);
        }
        return new Actor(null, null);
    }
}
