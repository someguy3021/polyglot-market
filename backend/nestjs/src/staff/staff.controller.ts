import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { IsIn, IsString, MinLength } from "class-validator";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, QueryFailedError } from "typeorm";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard, Roles } from "../common/roles.guard";
import { ContractError } from "../contract-exception.filter";
import { CategoryEntity, ProductEntity, PromoCodeEntity, UserEntity } from "../entities/shop.entities";
import { serializeProduct, serializePromo, serializeUser } from "../common/serialize";

export class RejectDto {
  @IsString()
  @MinLength(4)
  reason!: string;
}

export class RoleDto {
  @IsIn(["buyer", "seller", "moderator", "admin"])
  role!: "buyer" | "seller" | "moderator" | "admin";
}

export class PromoCodeInputDto {
  code!: string;
  type!: "percent" | "fixed";
  value!: number;
  minSubtotal?: number;
  maxUses?: number;
  expiresAt?: string;
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(PromoCodeEntity) private readonly promos: Repository<PromoCodeEntity>,
  ) {}

  // ---------- модерация ----------

  @Get("moderator/queue")
  @Roles("moderator", "admin")
  async queue(@Query("page") page = "1", @Query("perPage") perPage = "20") {
    const p = Number(page);
    const pp = Math.min(100, Number(perPage));
    const [rows, total] = await this.products.findAndCount({
      where: { status: "pending_moderation" },
      order: { createdAt: "ASC" },
      skip: (p - 1) * pp,
      take: pp,
    });
    const withRel = await this.loadProductRelations(rows);
    return {
      data: withRel.map((r) => serializeProduct(r.item, r.rel)),
      meta: { currentPage: p, lastPage: Math.max(1, Math.ceil(total / pp)), perPage: pp, total },
    };
  }

  @Post("moderator/products/:id/approve")
  @HttpCode(200)
  @Roles("moderator", "admin")
  async approve(@Param("id") id: string) {
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

  @Post("moderator/products/:id/reject")
  @HttpCode(200)
  @Roles("moderator", "admin")
  async reject(@Param("id") id: string, @Body() dto: RejectDto) {
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

  @Put("admin/users/:id/role")
  @Roles("admin")
  async updateUserRole(@Param("id") id: string, @Body() dto: RoleDto) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new ContractError(404, "not_found", "User not found.");
    user.role = dto.role;
    await this.userRepo.save(user);
    return serializeUser(user, null);
  }

  @Get("admin/users")
  @Roles("admin")
  async users(@Query("page") page = "1", @Query("perPage") perPage = "20", @Query("role") role?: string) {
    const p = Number(page);
    const pp = Math.min(100, Number(perPage));
    const [rows, total] = await this.userRepo.findAndCount({
      where: role ? { role: role as never } : {},
      order: { createdAt: "ASC" },
      skip: (p - 1) * pp,
      take: pp,
    });
    return {
      data: rows.map((u) => serializeUser(u, null)),
      meta: { currentPage: p, lastPage: Math.max(1, Math.ceil(total / pp)), perPage: pp, total },
    };
  }

  @Get("admin/promo-codes")
  @Roles("admin")
  async promoCodes() {
    const rows = await this.promos.find({ order: { code: "ASC" } });
    return { data: rows.map(serializePromo) };
  }

  @Post("admin/promo-codes")
  @Roles("admin")
  async createPromoCode(@Body() dto: PromoCodeInputDto) {
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

  @Delete("admin/products/:id")
  @Roles("admin")
  async deleteProduct(@Param("id") id: string) {
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
