package dev.polyglot.spring27.cart;

import java.util.Map;

import org.springframework.http.HttpHeaders;
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

import dev.polyglot.spring27.auth.UserRow;
import dev.polyglot.spring27.cart.CartService.Actor;
import dev.polyglot.spring27.cart.CartViews.CartView;
import dev.polyglot.spring27.common.CurrentUser;

import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

@RestController
public class CartController {

    private static final String UUID_RE =
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

    public static class CartItemInput {
        @NotBlank
        @Pattern(regexp = UUID_RE)
        public String productId;

        @NotNull
        @Min(1)
        @Max(99)
        public Integer quantity;
    }

    public static class QuantityInput {
        @NotNull
        @Min(1)
        @Max(99)
        public Integer quantity;
    }

    public static class MergeCartInput {
        @NotBlank
        @Pattern(regexp = UUID_RE)
        public String token;
    }

    private final CartService cart;

    public CartController(CartService cart) {
        this.cart = cart;
    }

    @GetMapping("/cart")
    public CartView get(@CurrentUser(required = false) UserRow user,
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken) {
        return cart.view(cart.resolve(actor(user, cartToken)).cart.id);
    }

    @PostMapping("/cart/items")
    public ResponseEntity<CartView> addItem(@CurrentUser(required = false) UserRow user,
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken,
            @Valid @RequestBody CartItemInput body) {
        Actor actor = actor(user, cartToken);
        CartService.Added added = cart.addItem(actor, body.productId, body.quantity);
        HttpHeaders headers = new HttpHeaders();
        Map<String, String> cartHeaders = cart.cartHeaders(actor, added.createdToken);
        for (Map.Entry<String, String> e : cartHeaders.entrySet()) {
            headers.set(e.getKey(), e.getValue());
        }
        return new ResponseEntity<CartView>(cart.view(added.cartId), headers, HttpStatus.CREATED);
    }

    @PatchMapping("/cart/items/{id}")
    public CartView updateItem(@CurrentUser(required = false) UserRow user,
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken,
            @PathVariable String id,
            @Valid @RequestBody QuantityInput body) {
        return cart.view(cart.setQuantity(actor(user, cartToken), id, body.quantity));
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
        return cart.view(cart.merge(user.id, body.token));
    }

    /** Паритет NestJS OptionalJwtAuthGuard: гость без токена допустим (создастся новая корзина). */
    private static Actor actor(UserRow user, String cartToken) {
        if (user != null) {
            return new Actor(user.id, null);
        }
        if (cartToken != null && !cartToken.trim().isEmpty()) {
            return new Actor(null, cartToken);
        }
        return new Actor(null, null);
    }
}
