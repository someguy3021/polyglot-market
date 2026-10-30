// Use-cases модерации и админки: очередь модератора, роли, промокоды.
// Логика вынесена из контроллера (Clean): контроллер только парсит HTTP и зовёт сервис.
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { CategoryEntity, ProductEntity, PromoCodeEntity, UserEntity } from "../../domain/entities/shop.entities";
import { ContractError } from "../../domain/errors/contract.error";
import { serializeProduct, serializePromo, serializeUser } from "../dto-mappers/serialize";
import { PromoCodeInputDto, RejectDto, RoleDto } from "./staff.dto";

export class StaffService {
  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(PromoCodeEntity) private readonly promos: Repository<PromoCodeEntity>,
  ) {}

  // ---------- модерация ----------

  async queue(page: number, perPage: number) {
    const [rows, total] = await this.products.findAndCount({
      where: { status: "pending_moderation" },
      order: { createdAt: "ASC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    const withRel = await this.loadProductRelations(rows);
    return {
      data: withRel.map((r) => serializeProduct(r.item, r.rel)),
      meta: { currentPage: page, lastPage: Math.max(1, Math.ceil(total / perPage)), perPage, total },
    };
  }

  async approve(id: string) {
    const product = await this.products.findOneBy({ id });
    if (!product) throw new ContractError(404, "not_found", "Product not found.");
    if (product.status !== "pending_moderation") {
      throw new ContractError(409, "conflict", "Product is not in the moderation queue.");
    }
    product.status = "approved";
    product.rejectionReason = null;
    await this.products.save(product);
    const [withRel] = await this.loadProductRelations([product]);
    return serializeProduct(withRel.item, withRel.rel);
  }

  async reject(id: string, dto: RejectDto) {
    const product = await this.products.findOneBy({ id });
    if (!product) throw new ContractError(404, "not_found", "Product not found.");
    if (product.status !== "pending_moderation") {
      throw new ContractError(409, "conflict", "Product is not in the moderation queue.");
    }
    product.status = "rejected";
    product.rejectionReason = dto.reason;
    await this.products.save(product);
    const [withRel] = await this.loadProductRelations([product]);
    return serializeProduct(withRel.item, withRel.rel);
  }

  // ---------- админ ----------

  async updateUserRole(id: string, dto: RoleDto) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new ContractError(404, "not_found", "User not found.");
    user.role = dto.role;
    await this.userRepo.save(user);
    return serializeUser(user, null);
  }

  async users(page: number, perPage: number, role?: string) {
    const [rows, total] = await this.userRepo.findAndCount({
      where: role ? { role: role as never } : {},
      order: { createdAt: "ASC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return {
      data: rows.map((u) => serializeUser(u, null)),
      meta: { currentPage: page, lastPage: Math.max(1, Math.ceil(total / perPage)), perPage, total },
    };
  }

  async promoCodes() {
    const rows = await this.promos.find({ order: { code: "ASC" } });
    return { data: rows.map(serializePromo) };
  }

  async createPromoCode(dto: PromoCodeInputDto) {
    if (dto.type === "percent" && dto.value > 100) {
      throw new ContractError(422, "unprocessable", "Percent discount cannot exceed 100.");
    }
    const exists = await this.promos.findOneBy({ code: dto.code });
    if (exists) {
      throw new ContractError(422, "validation_error", "The given data was invalid.", {
        code: ["The code has already been taken."],
      });
    }
    const promo = await this.promos.save(
      this.promos.create({
        code: dto.code,
        type: dto.type,
        value: dto.value.toFixed(2),
        minSubtotal: (dto.minSubtotal ?? 0).toFixed(2),
        maxUses: dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        active: true,
      }),
    );
    return serializePromo(promo);
  }

  async deleteProduct(id: string) {
    const product = await this.products.findOneBy({ id });
    if (!product) throw new ContractError(404, "not_found", "Product not found.");
    try {
      await this.products.remove(product);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        // FK: товар участвует в заказах
        throw new ContractError(409, "conflict", "Product is referenced by existing orders.");
      }
      throw err;
    }
  }

  private async loadProductRelations(items: ProductEntity[]) {
    // Пакетная догрузка связей (категория + продавец); картинки для очереди не нужны
    const [cats, users] = await Promise.all([
      this.products.manager.find(CategoryEntity),
      this.userRepo.find(),
    ]);
    const catById = new Map(cats.map((c) => [c.id, c]));
    const userById = new Map(users.map((u) => [u.id, u]));
    const out = [];
    for (const item of items) {
      const category = catById.get(item.categoryId);
      const seller = userById.get(item.sellerId);
      if (!category || !seller) throw new ContractError(500, "internal", "Broken product relations.");
      out.push({ item, rel: { category, seller, sellerProfile: null, images: [] } });
    }
    return out;
  }
}
