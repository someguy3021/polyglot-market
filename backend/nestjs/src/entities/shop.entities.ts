import { Column, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
export { UserEntity } from "./user.entity";

@Entity("categories")
export class CategoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", unique: true })
  slug!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId!: string | null;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;
}

@Entity("seller_profiles")
export class SellerProfileEntity {
  // PK таблицы — user_id (нет суррогатного id)
  @PrimaryColumn("uuid", { name: "user_id" })
  userId!: string;

  @Column({ name: "shop_name", type: "text", unique: true })
  shopName!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}

export type ProductStatus = "draft" | "pending_moderation" | "approved" | "rejected";

@Entity("products")
@Index("products_catalog_idx", ["status", "categoryId", "price"])
export class ProductEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "seller_id", type: "uuid" })
  sellerId!: string;

  @Column({ name: "category_id", type: "uuid" })
  categoryId!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text", unique: true })
  slug!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  price!: string;

  @Column({ type: "integer", default: 0 })
  stock!: number;

  @Column({ type: "enum", enumName: "product_status", enum: ["draft", "pending_moderation", "approved", "rejected"] })
  status!: ProductStatus;

  @Column({ name: "rejection_reason", type: "text", nullable: true })
  rejectionReason!: string | null;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}

@Entity("product_images")
export class ProductImageEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @Column({ type: "text", unique: true })
  key!: string;

  @Column({ name: "thumb_key", type: "text", nullable: true })
  thumbKey!: string | null;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;

  @Column({ type: "integer", default: 0 })
  sort!: number;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;
}

@Entity("carts")
export class CartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ type: "uuid", unique: true })
  token!: string;

  @Column({ name: "converted", type: "boolean", default: false })
  converted!: boolean;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}

@Entity("cart_items")
export class CartItemEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "cart_id", type: "uuid" })
  cartId!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @Column({ type: "integer" })
  quantity!: number;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;
}

@Entity("promo_codes")
export class PromoCodeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", unique: true })
  code!: string;

  @Column({ type: "enum", enumName: "promo_type", enum: ["percent", "fixed"] })
  type!: "percent" | "fixed";

  @Column({ type: "numeric", precision: 10, scale: 2 })
  value!: string;

  @Column({ name: "min_subtotal", type: "numeric", precision: 10, scale: 2, default: "0" })
  minSubtotal!: string;

  @Column({ name: "max_uses", type: "integer", nullable: true })
  maxUses!: number | null;

  @Column({ name: "used_count", type: "integer", default: 0 })
  usedCount!: number;

  @Column({ name: "expires_at", type: "timestamptz", nullable: true })
  expiresAt!: Date | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  rejectionReason(subtotal: number): string | null {
    if (!this.active) return "Promo code is inactive.";
    if (this.expiresAt !== null && this.expiresAt.getTime() < Date.now()) return "Promo code has expired.";
    if (this.maxUses !== null && this.usedCount >= this.maxUses) return "Promo code usage limit reached.";
    if (subtotal < Number(this.minSubtotal)) return `Promo code requires a minimum subtotal of ${this.minSubtotal}.`;
    return null;
  }

  discountFor(subtotal: number): number {
    const raw = this.type === "percent" ? (subtotal * Number(this.value)) / 100 : Number(this.value);
    return Math.round(Math.min(raw, subtotal) * 100) / 100;
  }
}

@Entity("shipping_methods")
export class ShippingMethodEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", unique: true })
  code!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  price!: string;

  @Column({ name: "eta_days", type: "integer" })
  etaDays!: number;

  @Column({ type: "boolean", default: true })
  active!: boolean;
}

export type OrderStatus = "new" | "paid" | "shipped" | "done" | "cancelled";

@Entity("orders")
export class OrderEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enumName: "order_status", enum: ["new", "paid", "shipped", "done", "cancelled"] })
  status!: OrderStatus;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  subtotal!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  discount!: string;

  @Column({ name: "shipping_price", type: "numeric", precision: 10, scale: 2 })
  shippingPrice!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  total!: string;

  @Column({ name: "promo_code_id", type: "uuid", nullable: true })
  promoCodeId!: string | null;

  @Column({ name: "shipping_method_id", type: "uuid" })
  shippingMethodId!: string;

  @Column({ name: "shipping_address", type: "jsonb" })
  shippingAddress!: Record<string, string>;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;

  // Допустимые переходы (контракт: PUT /admin/orders/{id}/status)
  static TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    new: ["paid", "cancelled"],
    paid: ["shipped", "cancelled"],
    shipped: ["done"],
    done: [],
    cancelled: [],
  };
}

@Entity("order_items")
export class OrderItemEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "order_id", type: "uuid" })
  orderId!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @Column({ name: "seller_id", type: "uuid" })
  sellerId!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  price!: string;

  @Column({ type: "integer" })
  quantity!: number;
}

@Entity("idempotency_keys")
export class IdempotencyKeyEntity {
  // Таблица без суррогатного PK: unique(key, user_id) + unique(order_id) — ADR-011
  @Column({ type: "uuid", primary: true })
  key!: string;

  @Column({ name: "user_id", type: "uuid", primary: true })
  userId!: string;

  @Column({ name: "order_id", type: "uuid", unique: true })
  orderId!: string;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;
}
