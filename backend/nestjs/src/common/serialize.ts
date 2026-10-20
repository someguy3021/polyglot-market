// Сериализация в форму контракта (аналог Resources в Laravel). Plain-объекты, camelCase.
import { CategoryEntity, OrderEntity, OrderItemEntity, ProductEntity, ProductImageEntity, PromoCodeEntity, ShippingMethodEntity, SellerProfileEntity, UserEntity } from "../entities/shop.entities";
import { S3_URL_BASE } from "./s3";

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export function serializeUser(u: UserEntity, profile?: SellerProfileEntity | null) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    blocked: u.blocked,
    shopName: profile?.shopName ?? null,
    createdAt: iso(u.createdAt),
  };
}

export function serializeCategory(c: CategoryEntity) {
  return { id: c.id, slug: c.slug, name: c.name, parentId: c.parentId };
}

export function serializeImage(i: ProductImageEntity) {
  return {
    id: i.id,
    url: `${S3_URL_BASE}/${i.key}`,
    thumbUrl: i.thumbKey ? `${S3_URL_BASE}/${i.thumbKey}` : null,
    isPrimary: i.isPrimary,
  };
}

export interface ProductRelations {
  category: CategoryEntity;
  seller: UserEntity;
  sellerProfile?: SellerProfileEntity | null;
  images: ProductImageEntity[];
}

export function serializeProduct(p: ProductEntity, rel: ProductRelations) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    price: Number(p.price),
    stock: p.stock,
    status: p.status,
    rejectionReason: p.rejectionReason,
    categoryId: p.categoryId,
    category: serializeCategory(rel.category),
    seller: {
      id: p.sellerId,
      shopName: rel.sellerProfile?.shopName ?? rel.seller.name,
    },
    images: rel.images.map(serializeImage),
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
  };
}

export function paginate<T>(items: T[], total: number, page: number, perPage: number) {
  return {
    data: items,
    meta: { currentPage: page, lastPage: Math.max(1, Math.ceil(total / perPage)), perPage, total },
  };
}

export function serializeShipping(m: ShippingMethodEntity) {
  return { code: m.code, name: m.name, price: Number(m.price), etaDays: m.etaDays };
}

export function serializeOrder(o: OrderEntity, items: OrderItemEntity[], method: ShippingMethodEntity, promoCode: string | null) {
  return {
    id: o.id,
    userId: o.userId,
    status: o.status,
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    shippingPrice: Number(o.shippingPrice),
    total: Number(o.total),
    promoCode,
    shippingMethod: serializeShipping(method),
    shippingAddress: o.shippingAddress,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      title: i.title,
      price: Number(i.price),
      quantity: i.quantity,
    })),
    createdAt: iso(o.createdAt),
    updatedAt: iso(o.updatedAt),
  };
}

export function serializePromo(p: PromoCodeEntity) {
  return {
    id: p.id,
    code: p.code,
    type: p.type,
    value: Number(p.value),
    minSubtotal: Number(p.minSubtotal),
    maxUses: p.maxUses,
    usedCount: p.usedCount,
    expiresAt: iso(p.expiresAt),
    active: p.active,
  };
}
