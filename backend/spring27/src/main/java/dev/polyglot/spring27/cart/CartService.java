package dev.polyglot.spring27.cart;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.polyglot.spring27.cart.CartRepository.CartItemRow;
import dev.polyglot.spring27.cart.CartRepository.CartRow;
import dev.polyglot.spring27.cart.CartViews.CartItemView;
import dev.polyglot.spring27.cart.CartViews.CartProductView;
import dev.polyglot.spring27.cart.CartViews.CartView;
import dev.polyglot.spring27.catalog.CatalogViews.ImageView;
import dev.polyglot.spring27.common.ContractException;
import dev.polyglot.spring27.config.S3Props;
import dev.polyglot.spring27.products.ProductsRepository;
import dev.polyglot.spring27.products.ProductsRepository.ImageRow;
import dev.polyglot.spring27.products.ProductsRepository.ProductRow;

/** Корзина: гостевая по X-Cart-Token, аккаунтная по user_id; паритет NestJS cart.service. */
@Service
public class CartService {

    public static class Actor {
        public final String userId;
        public final String cartToken;

        public Actor(String userId, String cartToken) {
            this.userId = userId;
            this.cartToken = cartToken;
        }
    }

    public static class Resolved {
        public final CartRow cart;
        public final String createdToken;

        public Resolved(CartRow cart, String createdToken) {
            this.cart = cart;
            this.createdToken = createdToken;
        }
    }

    public static class Added {
        public final String cartId;
        public final String createdToken;

        public Added(String cartId, String createdToken) {
            this.cartId = cartId;
            this.createdToken = createdToken;
        }
    }

    private final CartRepository carts;
    private final ProductsRepository products;
    private final S3Props s3;

    public CartService(CartRepository carts, ProductsRepository products, S3Props s3) {
        this.carts = carts;
        this.products = products;
        this.s3 = s3;
    }

    /** Гостевая (по X-Cart-Token) или аккаунтная корзина; новому гостю — новый токен. */
    public Resolved resolve(Actor actor) {
        if (actor.userId != null) {
            // Схема: unique(user_id) — одна корзина на пользователя; после заказа
            // переиспользуем строку, сбрасывая converted (паритет Laravel firstOrCreate).
            CartRow existing = carts.findByUserId(actor.userId);
            if (existing != null) {
                if (existing.converted) {
                    carts.setConverted(existing.id, false);
                }
                return new Resolved(existing, null);
            }
            // токен обязателен по схеме, но для аккаунтной корзины никогда не отдаётся
            CartRow created = new CartRow(UUID.randomUUID().toString(), actor.userId,
                    UUID.randomUUID().toString(), false);
            carts.insert(created.id, created.userId, created.token);
            return new Resolved(created, null);
        }
        if (actor.cartToken != null) {
            CartRow guest = carts.findByToken(actor.cartToken);
            if (guest != null && guest.userId == null) {
                if (guest.converted) {
                    carts.setConverted(guest.id, false);
                }
                return new Resolved(guest, null);
            }
        }
        String token = UUID.randomUUID().toString();
        CartRow created = new CartRow(UUID.randomUUID().toString(), null, token, false);
        carts.insert(created.id, null, token);
        return new Resolved(created, token);
    }

    /** Заголовок X-Cart-Token для гостя (контракт POST /cart/items). */
    public Map<String, String> cartHeaders(Actor actor, String createdToken) {
        if (actor.userId != null) {
            return new LinkedHashMap<String, String>();
        }
        String token = createdToken != null ? createdToken : actor.cartToken;
        Map<String, String> out = new LinkedHashMap<String, String>();
        if (token != null) {
            out.put("X-Cart-Token", token);
        }
        return out;
    }

    public CartView view(String cartId) {
        CartRow cart = carts.findById(cartId);
        List<CartItemRow> items = carts.itemsByCart(cartId);
        List<String> productIds = new ArrayList<String>();
        for (CartItemRow item : items) {
            if (!productIds.contains(item.productId)) {
                productIds.add(item.productId);
            }
        }
        Map<String, ProductRow> prodById = new HashMap<String, ProductRow>();
        for (ProductRow p : products.findByIds(productIds)) {
            prodById.put(p.id, p);
        }
        Map<String, List<ImageRow>> imagesByProduct = new HashMap<String, List<ImageRow>>();
        for (ImageRow img : products.imagesByProducts(productIds)) {
            List<ImageRow> list = imagesByProduct.get(img.productId);
            if (list == null) {
                list = new ArrayList<ImageRow>();
                imagesByProduct.put(img.productId, list);
            }
            list.add(img);
        }

        String urlBase = s3.publicUrlBase();
        BigDecimal subtotal = BigDecimal.ZERO.setScale(2);
        List<CartItemView> views = new ArrayList<CartItemView>();
        for (CartItemRow item : items) {
            ProductRow p = prodById.get(item.productId);
            if (p == null) {
                throw new IllegalStateException("Cart item " + item.id + " has broken product relation.");
            }
            BigDecimal lineTotal = p.price.multiply(BigDecimal.valueOf(item.quantity));
            List<ImageView> images = new ArrayList<ImageView>();
            for (ImageRow img : imagesByProduct.containsKey(p.id) ? imagesByProduct.get(p.id)
                    : new ArrayList<ImageRow>()) {
                images.add(new ImageView(img.id, urlBase + "/" + img.key,
                        img.thumbKey == null ? null : urlBase + "/" + img.thumbKey, img.isPrimary));
            }
            views.add(new CartItemView(item.id, item.quantity,
                    new CartProductView(p.id, p.title, p.price, images), lineTotal));
            subtotal = subtotal.add(lineTotal);
        }
        return new CartView(cart.id, views, subtotal.setScale(2, RoundingMode.HALF_UP));
    }

    public Added addItem(Actor actor, String productId, int quantity) {
        Resolved resolved = resolve(actor);
        ProductRow product = products.findById(productId);
        if (product == null) {
            throw ContractException.notFound("Product not found.");
        }
        if (!"approved".equals(product.status)) {
            throw ContractException.conflict("Product is not available for purchase.");
        }
        if (product.stock <= 0) {
            throw ContractException.conflict("Product is out of stock.");
        }
        CartItemRow existing = carts.findItemByProduct(resolved.cart.id, productId);
        int newQty = (existing != null ? existing.quantity : 0) + quantity;
        if (newQty > product.stock) {
            throw ContractException.conflict("Requested quantity exceeds stock.");
        }
        if (existing != null) {
            carts.updateItemQuantity(existing.id, newQty);
        } else {
            carts.insertItem(UUID.randomUUID().toString(), resolved.cart.id, productId, quantity);
        }
        return new Added(resolved.cart.id, resolved.createdToken);
    }

    public String setQuantity(Actor actor, String itemId, int quantity) {
        CartItemRow item = ownedItem(actor, itemId);
        ProductRow product = products.findById(item.productId);
        if (product == null || product.stock < quantity) {
            throw ContractException.conflict("Requested quantity exceeds stock.");
        }
        carts.updateItemQuantity(item.id, quantity);
        return item.cartId;
    }

    public String removeItem(Actor actor, String itemId) {
        CartItemRow item = ownedItem(actor, itemId);
        carts.deleteItem(item.id);
        return item.cartId;
    }

    /** Мердж гостевой корзины в аккаунтную (позиции по товару суммируются до 99). */
    @Transactional
    public String merge(String userId, String guestToken) {
        CartRow account = carts.findByUserId(userId);
        if (account == null || account.converted) {
            account = new CartRow(UUID.randomUUID().toString(), userId, UUID.randomUUID().toString(), false);
            carts.insert(account.id, userId, account.token);
        }
        CartRow guest = carts.findByToken(guestToken);
        if (guest == null || guest.converted || guest.id.equals(account.id)) {
            return account.id;
        }
        for (CartItemRow item : carts.itemsByCart(guest.id)) {
            CartItemRow target = carts.findItemByProduct(account.id, item.productId);
            if (target != null) {
                carts.updateItemQuantity(target.id, Math.min(99, target.quantity + item.quantity));
            } else {
                carts.insertItem(UUID.randomUUID().toString(), account.id, item.productId, item.quantity);
            }
        }
        carts.setConverted(guest.id, true);
        return account.id;
    }

    private CartItemRow ownedItem(Actor actor, String itemId) {
        Resolved resolved = resolve(actor);
        CartItemRow item = carts.findItem(resolved.cart.id, itemId);
        if (item == null) {
            throw ContractException.notFound("Cart item not found.");
        }
        return item;
    }
}
