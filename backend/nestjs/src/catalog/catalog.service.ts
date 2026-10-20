import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import {
  CategoryEntity,
  ProductEntity,
  ProductImageEntity,
  SellerProfileEntity,
  UserEntity,
} from "../entities/shop.entities";
import { paginate, serializeProduct } from "../common/serialize";

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity) private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(SellerProfileEntity) private readonly profiles: Repository<SellerProfileEntity>,
    @InjectRepository(ProductImageEntity) private readonly images: Repository<ProductImageEntity>,
  ) {}

  async list(query: {
    page?: number;
    perPage?: number;
    category?: string;
    seller?: string;
    q?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: "newest" | "oldest" | "price_asc" | "price_desc";
  }) {
    const page = query.page ?? 1;
    const perPage = Math.min(100, query.perPage ?? 20);

    const qb = this.products
      .createQueryBuilder("p")
      .where("p.status = :status", { status: "approved" });

    if (query.category) {
      qb.andWhere(
        `p.category_id IN (SELECT c.id FROM categories c WHERE c.slug = :categorySlug)`,
        { categorySlug: query.category },
      );
    }
    if (query.seller) {
      qb.andWhere(
        `p.seller_id IN (SELECT sp.user_id FROM seller_profiles sp WHERE sp.shop_name = :shop)`,
        { shop: query.seller },
      );
    }
    if (query.q) {
      qb.andWhere("p.title ILIKE :like", { like: `%${query.q}%` });
    }
    if (query.priceMin !== undefined) qb.andWhere("p.price >= :priceMin", { priceMin: query.priceMin });
    if (query.priceMax !== undefined) qb.andWhere("p.price <= :priceMax", { priceMax: query.priceMax });

    const order: "ASC" | "DESC" = query.sort === "price_asc" || query.sort === "oldest" ? "ASC" : "DESC";
    qb.orderBy(query.sort === "price_asc" || query.sort === "price_desc" ? "p.price" : "p.createdAt", order);

    const [rows, total] = await qb.skip((page - 1) * perPage).take(perPage).getManyAndCount();
    const serialized = await Promise.all((await this.withRelations(rows)).map((p) => serializeProduct(p.item, p.rel)));
    return paginate(serialized, total, page, perPage);
  }

  async one(id: string) {
    const product = await this.products.findOne({ where: { id, status: "approved" } });
    if (!product) throw new NotFoundException("Product not found.");
    const [withRel] = await this.withRelations([product]);
    return serializeProduct(withRel.item, withRel.rel);
  }

  async listCategories() {
    const rows = await this.categoryRepo.find({ order: { name: "ASC" } });
    return {
      data: rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name, parentId: c.parentId })),
    };
  }

  /** Пакетная догрузка связей для страницы товаров. */
  async withRelations(items: ProductEntity[]): Promise<Array<{ item: ProductEntity; rel: {
    category: CategoryEntity;
    seller: UserEntity;
    sellerProfile?: SellerProfileEntity | null;
    images: ProductImageEntity[];
  } }>> {
    const categoryIds = [...new Set(items.map((p) => p.categoryId))];
    const sellerIds = [...new Set(items.map((p) => p.sellerId))];
    const productIds = items.map((p) => p.id);

    const [cats, sellers, profiles, images] = await Promise.all([
      this.categoryRepo.find({ where: { id: In(categoryIds) } }),
      this.users.find({ where: { id: In(sellerIds) } }),
      this.profiles.find({ where: { userId: In(sellerIds) } }),
      productIds.length
        ? this.images.find({ where: { productId: In(productIds) }, order: { sort: "ASC" } })
        : Promise.resolve([] as ProductImageEntity[]),
    ]);

    const catById = new Map(cats.map((c) => [c.id, c]));
    const userById = new Map(sellers.map((u) => [u.id, u]));
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));
    const imagesByProduct = new Map<string, ProductImageEntity[]>();
    for (const img of images) {
      imagesByProduct.set(img.productId, [...(imagesByProduct.get(img.productId) ?? []), img]);
    }

    return items.map((item) => {
      const category = catById.get(item.categoryId);
      const seller = userById.get(item.sellerId);
      if (!category || !seller) throw new NotFoundException(`Product ${item.id} has broken relations.`);
      return {
        item,
        rel: {
          category,
          seller,
          sellerProfile: profileByUser.get(item.sellerId) ?? null,
          images: imagesByProduct.get(item.id) ?? [],
        },
      };
    });
  }
}
