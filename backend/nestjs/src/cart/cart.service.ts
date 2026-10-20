import { ForbiddenException, Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, In } from "typeorm";
import { randomUUID } from "node:crypto";
import {
  CartEntity,
  CartItemEntity,
  ProductEntity,
  ProductImageEntity,
} from "../entities/shop.entities";
import { S3_URL_BASE } from "../common/s3";

export interface Actor {
  userId?: string; // авторизован
  cartToken?: string; // гостевой токен
}

@Injectable()
export class CartService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CartEntity) private readonly carts: Repository<CartEntity>,
    @InjectRepository(CartItemEntity) private readonly items: Repository<CartItemEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity) private readonly images: Repository<ProductImageEntity>,
  ) {}

  /** Гостевая (по X-Cart-Token) или аккаунтная корзина; нового гостя создаём с новым токеном. */
  async resolve(actor: Actor): Promise<{ cart: CartEntity; createdToken?: string }> {
    if (actor.userId) {
      // Схема: unique(user_id) — ровно одна корзина на пользователя; после заказа
      // переиспользуем строку, сбрасывая converted (паритет с Laravel firstOrCreate).
      const existing = await this.carts.findOneBy({ userId: actor.userId });
      if (existing) {
        if (existing.converted) {
          existing.converted = false;
          await this.carts.save(existing);
        }
        return { cart: existing };
      }
      const cart = await this.carts.save(this.carts.create({ userId: actor.userId, converted: false }));
      return { cart };
    }
    if (actor.cartToken) {
      const cart = await this.carts.findOneBy({ token: actor.cartToken });
      if (cart && cart.userId === null) {
        if (cart.converted) {
          cart.converted = false;
          await this.carts.save(cart);
        }

        return { cart };
      }
    }
    const token = randomUUID();
    const cart = await this.carts.save(this.carts.create({ token, converted: false }));
    return { cart, createdToken: token };
  }

  /** Гостю проставляем заголовок X-Cart-Token (контракт POST /cart/items). */
  cartHeaders(actor: Actor, createdToken?: string): Record<string, string> {
    if (actor.userId) return {};
    const token = createdToken ?? actor.cartToken;
    return token ? { "x-cart-token": token } : {};
  }

  async view(cartId: string) {
    const cart = await this.carts.findOneByOrFail({ id: cartId });
    const items = await this.items.find({ where: { cartId }, order: { createdAt: "ASC" } });
    const productIds = items.map((i) => i.productId);
    const prods = productIds.length
      ? await this.products.find({ where: { id: In(productIds) } })
      : [];
    const imgs = productIds.length
      ? await this.images.find({ where: { productId: In(productIds) } })
      : [];
    const prodById = new Map(prods.map((p) => [p.id, p]));
    const imgByProduct = new Map<string, Array<{ url: string; isPrimary: boolean }>>();
    for (const img of imgs) {
      imgByProduct.set(img.productId, [
        ...(imgByProduct.get(img.productId) ?? []),
        { url: `${S3_URL_BASE}/${img.key}`, isPrimary: img.isPrimary },
      ]);
    }

    const viewItems = items.map((item) => {
      const p = prodById.get(item.productId)!;
      return {
        id: item.id,
        quantity: item.quantity,
        product: {
          id: p.id,
          title: p.title,
          price: Number(p.price),
          images: imgByProduct.get(p.id) ?? [],
        },
        lineTotal: Number(p.price) * item.quantity,
      };
    });
    return {
      id: cart.id,
      items: viewItems,
      subtotal: Math.round(viewItems.reduce((acc, i) => acc + i.lineTotal, 0) * 100) / 100,
    };
  }

  async addItem(actor: Actor, productId: string, quantity: number): Promise<{ cartId: string; createdToken?: string }> {
    const { cart, createdToken } = await this.resolve(actor);
    const product = await this.products.findOneBy({ id: productId });
    if (!product) throw new NotFoundException("Product not found.");
    if (product.status !== "approved") throw new ConflictException("Product is not available for purchase.");
    if (product.stock <= 0) throw new ConflictException("Product is out of stock.");

    const existing = await this.items.findOneBy({ cartId: cart.id, productId });
    const newQty = (existing?.quantity ?? 0) + quantity;
    if (newQty > product.stock) throw new ConflictException("Requested quantity exceeds stock.");
    if (existing) {
      existing.quantity = newQty;
      await this.items.save(existing);
    } else {
      await this.items.save(this.items.create({ cartId: cart.id, productId, quantity }));
    }
    return { cartId: cart.id, createdToken };
  }

  async ownedItem(actor: Actor, itemId: string) {
    const cart = await this.resolve(actor);
    const item = await this.items.findOneBy({ id: itemId, cartId: cart.cart.id });
    if (!item) throw new NotFoundException("Cart item not found.");
    return { cart: cart.cart, item };
  }

  async setQuantity(actor: Actor, itemId: string, quantity: number) {
    const { cart, item } = await this.ownedItem(actor, itemId);
    const product = await this.products.findOneByOrFail({ id: item.productId });
    if (product.stock < quantity) throw new ConflictException("Requested quantity exceeds stock.");
    item.quantity = quantity;
    await this.items.save(item);
    return cart.id;
  }

  async removeItem(actor: Actor, itemId: string) {
    const { item } = await this.ownedItem(actor, itemId);
    await this.items.remove(item);
  }

  /** Мердж гостевой корзины в аккаунтную после логина (позиции по товару суммируются до 99). */
  async merge(userId: string, guestToken: string) {
    const accountCart = await this.carts.findOneBy({ userId, converted: false })
      ?? (await this.carts.save(this.carts.create({ userId, converted: false })));
    const guestCart = await this.carts.findOneBy({ token: guestToken, converted: false });
    if (!guestCart || guestCart.id === accountCart.id) return accountCart.id;

    await this.dataSource.transaction(async (manager) => {
      const guestItems = await manager.find(CartItemEntity, { where: { cartId: guestCart.id } });
      for (const item of guestItems) {
        const target = await manager.findOne(CartItemEntity, { where: { cartId: accountCart.id, productId: item.productId } });
        if (target) {
          target.quantity = Math.min(99, target.quantity + item.quantity);
          await manager.save(target);
        } else {
          await manager.save(manager.create(CartItemEntity, {
            cartId: accountCart.id,
            productId: item.productId,
            quantity: item.quantity,
          }));
        }
      }
      guestCart.converted = true;
      await manager.save(guestCart);
    });
    return accountCart.id;
  }
}
