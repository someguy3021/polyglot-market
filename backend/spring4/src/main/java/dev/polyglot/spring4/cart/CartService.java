package dev.polyglot.spring4.cart;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.polyglot.spring4.cart.CartRepository.CartItemRow;
import dev.polyglot.spring4.cart.CartRepository.CartRow;
import dev.polyglot.spring4.cart.CartViews.CartItemView;
import dev.polyglot.spring4.cart.CartViews.CartProductView;
import dev.polyglot.spring4.cart.CartViews.CartView;
import dev.polyglot.spring4.catalog.CatalogViews.ImageView;
import dev.polyglot.spring4.common.ContractException;
import dev.polyglot.spring4.products.ProductsRepository;
import dev.polyglot.spring4.products.ProductsRepository.ImageRow;
import dev.polyglot.spring4.products.ProductsRepository.ProductRow;

/** Корзина: гостевая по X-Cart-Token, аккаунтная по user_id; паритет NestJS cart.service. */
@Service
public class CartService {

    public record Actor(String userId, String cartToken) {
    }

    public record Resolved(CartRow cart, String createdToken) {
    }

    public record Added(String cartId, String createdToken) {
    }

    private final CartRepository carts;
    private final ProductsRepository products;
    private final dev.polyglot.spring4.config.S3Props s3;

    public CartService(CartRepository carts, ProductsRepository products, dev.polyglot.spring4.config.S3Props s3) {
        this.carts = carts;
        this.products = products;
        this.s3 = s3;
    }

    /** Гостевая (по X-Cart-Token) или аккаунтная корзина; новому гостю — новый токен. */
    public Resolved resolve(Actor actor) {
        if (actor.userId() != null) {
            // Схема: unique(user_id) — одна корзина на пользователя; после заказа
            // переиспользуем строку, сбрасывая converted (паритет Laravel firstOrCreate).
            CartRow existing = carts.findByUserId(actor.userId()).orElse(null);
            if (existing != null) {
                if (existing.converted()) {
                    carts.setConverted(existing.id(), false);
                }
                return new Resolved(existing, null);
            }
            // токен обязателен по схеме, но для аккаунтной корзины никогда не отдаётся
            CartRow created = new CartRow(UUID.randomUUID().toString(), actor.userId(),
                    UUID.randomUUID().toString(), false);
            carts.insert(created.id(), created.userId(), created.token());
            return new Resolved(created, null);
        }
        if (actor.cartToken() != null) {
            CartRow guest = carts.findByToken(actor.cartToken()).orElse(null);
            if (guest != null && guest.userId() == null) {
                if (guest.converted()) {
                    carts.setConverted(guest.id(), false);
                }
                return new Resolved(guest, null);
            }
        }
        String token = UUID.randomUUID().toString();
        CartRow created = new CartRow(UUID.randomUUID().toString(), null, token, false);
        carts.insert(created.id(), null, token);
        return new Resolved(created, token);
    }

    /** Заголовок X-Cart-Token для гостя (контракт POST /cart/items). */
    public Map<String, String> cartHeaders(Actor actor, String createdToken) {
        if (actor.userId() != null) {
            return Map.of();
        }
        String token = createdToken != null ? createdToken : actor.cartToken();
        return token == null ? Map.of() : Map.of("X-Cart-Token", token);
    }

    public CartView view(String cartId) {
        CartRow cart = carts.findById(cartId).orElseThrow();
        List<CartItemRow> items = carts.itemsByCart(cartId);
        List<String> productIds = items.stream().map(CartItemRow::productId).distinct().toList();
        Map<String, ProductRow> prodById = new HashMap<>();
        products.findByIds(productIds).forEach(p -> prodById.put(p.id(), p));
        Map<String, List<ImageRow>> imagesByProduct = new HashMap<>();
        products.imagesByProducts(productIds).forEach(img ->
                imagesByProduct.computeIfAbsent(img.productId(), k -> new ArrayList<>()).add(img));

        String urlBase = publicUrlBase();
        BigDecimal subtotal = BigDecimal.ZERO.setScale(2);
        List<CartItemView> views = new ArrayList<>();
        for (CartItemRow item : items) {
            ProductRow p = prodById.get(item.productId());
            if (p == null) {
                throw new IllegalStateException("Cart item " + item.id() + " has broken product relation.");
            }
            BigDecimal lineTotal = p.price().multiply(BigDecimal.valueOf(item.quantity()));
            List<ImageView> images = imagesByProduct.getOrDefault(p.id(), List.of()).stream()
                    .map(img -> new ImageView(img.id(), urlBase + "/" + img.key(),
                            img.thumbKey() == null ? null : urlBase + "/" + img.thumbKey(), img.isPrimary()))
                    .toList();
            views.add(new CartItemView(item.id(), item.quantity(),
                    new CartProductView(p.id(), p.title(), p.price(), images), lineTotal));
            subtotal = subtotal.add(lineTotal);
        }
        return new CartView(cart.id(), views, subtotal.setScale(2, RoundingMode.HALF_UP));
    }

    public Added addItem(Actor actor, String productId, int quantity) {
        Resolved resolved = resolve(actor);
        ProductRow product = products.findById(productId)
                .orElseThrow(() -> ContractException.notFound("Product not found."));
        if (!"approved".equals(product.status())) {
            throw ContractException.conflict("Product is not available for purchase.");
        }
        if (product.stock() <= 0) {
            throw ContractException.conflict("Product is out of stock.");
        }
        CartItemRow existing = carts.findItemByProduct(resolved.cart().id(), productId).orElse(null);
        int newQty = (existing != null ? existing.quantity() : 0) + quantity;
        if (newQty > product.stock()) {
            throw ContractException.conflict("Requested quantity exceeds stock.");
        }
        if (existing != null) {
            carts.updateItemQuantity(existing.id(), newQty);
        } else {
            carts.insertItem(UUID.randomUUID().toString(), resolved.cart().id(), productId, quantity);
        }
        return new Added(resolved.cart().id(), resolved.createdToken());
    }

    public String setQuantity(Actor actor, String itemId, int quantity) {
        Owned owned = ownedItem(actor, itemId);
        ProductRow product = products.findById(owned.item().productId()).orElseThrow();
        if (product.stock() < quantity) {
            throw ContractException.conflict("Requested quantity exceeds stock.");
        }
        carts.updateItemQuantity(owned.item().id(), quantity);
        return owned.cart().id();
    }

    public String removeItem(Actor actor, String itemId) {
        Owned owned = ownedItem(actor, itemId);
        carts.deleteItem(owned.item().id());
        return owned.cart().id();
    }

    /** Мердж гостевой корзины в аккаунтную (позиции по товару суммируются до 99). */
    @Transactional
    public String merge(String userId, String guestToken) {
        CartRow accountCart = carts.findByUserId(userId).filter(c -> !c.converted()).orElse(null);
        if (accountCart == null) {
            accountCart = new CartRow(UUID.randomUUID().toString(), userId, UUID.randomUUID().toString(), false);
            carts.insert(accountCart.id(), userId, accountCart.token());
        }
        CartRow guestCart = carts.findByToken(guestToken).filter(c -> !c.converted()).orElse(null);
        if (guestCart == null || guestCart.id().equals(accountCart.id())) {
            return accountCart.id();
        }
        for (CartItemRow item : carts.itemsByCart(guestCart.id())) {
            CartItemRow target = carts.findItemByProduct(accountCart.id(), item.productId()).orElse(null);
            if (target != null) {
                carts.updateItemQuantity(target.id(), Math.min(99, target.quantity() + item.quantity()));
            } else {
                carts.insertItem(UUID.randomUUID().toString(), accountCart.id(), item.productId(), item.quantity());
            }
        }
        carts.setConverted(guestCart.id(), true);
        return accountCart.id();
    }

    private record Owned(CartRow cart, CartItemRow item) {
    }

    private Owned ownedItem(Actor actor, String itemId) {
        Resolved resolved = resolve(actor);
        CartItemRow item = carts.findItem(resolved.cart().id(), itemId)
                .orElseThrow(() -> ContractException.notFound("Cart item not found."));
        return new Owned(resolved.cart(), item);
    }

    private String publicUrlBase() {
        return s3.publicUrlBase();
    }
}
