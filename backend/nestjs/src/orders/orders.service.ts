import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  CartEntity,
  CartItemEntity,
  IdempotencyKeyEntity,
  OrderEntity,
  OrderItemEntity,
  ProductEntity,
  PromoCodeEntity,
  ShippingMethodEntity,
} from "../entities/shop.entities";
import { ContractError } from "../contract-exception.filter";
import { serializeOrder } from "../common/serialize";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface OrderInputDto {
  shippingMethodCode: string;
  promoCode?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    zip: string;
    country: string;
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItems: Repository<OrderItemEntity>,
    @InjectRepository(IdempotencyKeyEntity) private readonly idempotency: Repository<IdempotencyKeyEntity>,
    @InjectRepository(CartEntity) private readonly carts: Repository<CartEntity>,
    @InjectRepository(CartItemEntity) private readonly cartItems: Repository<CartItemEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(PromoCodeEntity) private readonly promos: Repository<PromoCodeEntity>,
    @InjectRepository(ShippingMethodEntity) private readonly shipping: Repository<ShippingMethodEntity>,
  ) {}

  shippingMethods() {
    return this.shipping.find({ where: { active: true }, order: { price: "ASC" } });
  }

  async validatePromo(code: string, subtotal: number) {
    const promo = await this.promos.findOneBy({ code });
    const reason = promo?.rejectionReason(subtotal);
    if (!promo || reason !== null) {
      throw new ContractError(422, "unprocessable", reason ?? "Promo code not found.");
    }
    return { code: promo.code, valid: true, discount: promo.discountFor(subtotal), reason: null };
  }

  /** Оформление заказа: идемпотентно по (key, userId), транзакция с блокировками (ADR-011). */
  async create(userId: string, idempotencyKey: string | undefined, dto: OrderInputDto) {
    if (!idempotencyKey || !UUID_RE.test(idempotencyKey)) {
      throw new ContractError(422, "validation_error", "The given data was invalid.", {
        "Idempotency-Key": ["A valid UUID Idempotency-Key header is required."],
      });
    }

    const existing = await this.idempotency.findOneBy({ key: idempotencyKey, userId });
    if (existing) {
      const order = await this.loadOrder(existing.orderId);
      return { status: 200, body: this.body(order) };
    }

    const order = await this.dataSource.transaction(async (manager) => {
      const cart = await manager
        .getRepository(CartEntity)
        .createQueryBuilder("c")
        .where("c.user_id = :userId AND c.converted = false", { userId })
        .setLock("pessimistic_write")
        .getOne();
      const cartItems = cart
        ? await manager.find(CartItemEntity, { where: { cartId: cart.id } })
        : [];
      if (!cart || cartItems.length === 0) throw new ConflictException("Cart is empty.");

      let subtotal = 0;
      const productRows: ProductEntity[] = [];
      for (const item of cartItems) {
        const product = await manager
          .getRepository(ProductEntity)
          .createQueryBuilder("p")
          .where("p.id = :id", { id: item.productId })
          .setLock("pessimistic_write")
          .getOne();
        if (!product || product.status !== "approved") {
          throw new ConflictException(`Product is not available for purchase.`);
        }
        if (product.stock < item.quantity) {
          throw new ConflictException(`Insufficient stock for ${product.title}.`);
        }
        subtotal += Number(product.price) * item.quantity;
        productRows.push(product);
      }
      subtotal = Math.round(subtotal * 100) / 100;

      let promo: PromoCodeEntity | null = null;
      let discount = 0;
      if (dto.promoCode) {
        promo = await manager.findOneBy(PromoCodeEntity, { code: dto.promoCode });
        const reason = promo?.rejectionReason(subtotal);
        if (!promo || reason !== null) throw new ContractError(422, "unprocessable", reason ?? "Promo code not found.");
        discount = promo.discountFor(subtotal);
      }

      const method = await manager.findOneBy(ShippingMethodEntity, {
        code: dto.shippingMethodCode,
        active: true,
      });
      if (!method) throw new ContractError(422, "unprocessable", "Unknown shipping method.");

      const shippingPrice = Number(method.price);
      const total = Math.round((subtotal - discount + shippingPrice) * 100) / 100;

      const order = await manager.save(
        manager.create(OrderEntity, {
          userId,
          status: "new",
          subtotal: subtotal.toFixed(2),
          discount: discount.toFixed(2),
          shippingPrice: shippingPrice.toFixed(2),
          total: total.toFixed(2),
          promoCodeId: promo?.id ?? null,
          shippingMethodId: method.id,
          shippingAddress: dto.shippingAddress as Record<string, string>,
        }),
      );

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i]!;
        const product = productRows[i]!;
        await manager.save(manager.create(OrderItemEntity, {
          orderId: order.id,
          productId: product.id,
          sellerId: product.sellerId,
          title: product.title,
          price: product.price,
          quantity: item.quantity,
        }));
        await manager.decrement(ProductEntity, { id: product.id }, "stock", item.quantity);
      }

      if (promo) await manager.increment(PromoCodeEntity, { id: promo.id }, "usedCount", 1);
      // корзина после оформления пуста: позиции списаны в заказ
      await manager.remove(cartItems);
      cart.converted = true;
      await manager.save(cart);
      await manager.save(manager.create(IdempotencyKeyEntity, { key: idempotencyKey, userId, orderId: order.id }));

      return order;
    });

    const loaded = await this.loadOrder(order.id);
    return { status: 201, body: this.body(loaded) };
  }

  async listMine(userId: string, page: number, perPage: number) {
    const [rows, total] = await this.orders.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    const data = [];
    for (const order of rows) data.push(this.body(await this.loadOrder(order.id)));
    return { data, meta: meta(total, page, perPage) };
  }

  async oneFor(requestUserId: string, role: string | undefined, id: string) {
    const order = await this.orders.findOneBy({ id });
    if (!order) throw new ContractError(404, "not_found", "Order not found.");
    if (order.userId !== requestUserId && !["moderator", "admin"].includes(role ?? "")) {
      throw new ContractError(403, "forbidden", "Forbidden.");
    }
    return this.body(await this.loadOrder(order.id));
  }

  async allForAdmin(page: number, perPage: number, status?: string) {
    const [rows, total] = await this.orders.findAndCount({
      where: status ? { status: status as never } : {},
      order: { createdAt: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    const data = [];
    for (const order of rows) data.push(this.body(await this.loadOrder(order.id)));
    return { data, meta: meta(total, page, perPage) };
  }

  async changeStatus(id: string, status: string) {
    const order = await this.orders.findOneBy({ id });
    if (!order) throw new ContractError(404, "not_found", "Order not found.");
    const allowed = OrderEntity.TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status as never)) {
      throw new ContractError(409, "conflict", `Invalid transition ${order.status} → ${status}.`);
    }
    order.status = status as never;
    await this.orders.save(order);
    return this.body(await this.loadOrder(order.id));
  }

  private async loadOrder(id: string) {
    const order = await this.orders.findOneByOrFail({ id });
    const [items, method, promo] = await Promise.all([
      this.orderItems.find({ where: { orderId: id } }),
      this.shipping.findOneByOrFail({ id: order.shippingMethodId }),
      order.promoCodeId
        ? this.promos.findOneBy({ id: order.promoCodeId })
        : Promise.resolve(null),
    ]);
    return { order, items, method, promo };
  }

  private body(loaded: { order: OrderEntity; items: OrderItemEntity[]; method: ShippingMethodEntity; promo: PromoCodeEntity | null }) {
    return serializeOrder(loaded.order, loaded.items, loaded.method, loaded.promo?.code ?? null);
  }
}

function meta(total: number, page: number, perPage: number) {
  return { currentPage: page, lastPage: Math.max(1, Math.ceil(total / perPage)), perPage, total };
}

