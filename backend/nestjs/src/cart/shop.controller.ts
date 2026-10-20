import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { IsInt, IsNumber, IsString, IsUUID, Max, Min } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { CartService, type Actor } from "./cart.service";
import { CatalogService } from "../catalog/catalog.service";
import { OrdersService } from "../orders/orders.service";
import type { UserEntity } from "../entities/user.entity";

class AddCartItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

class MergeCartDto {
  @IsUUID()
  token!: string;
}

class PromoValidateDto {
  @IsString()
  code!: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;
}

@Controller()
export class ShopController {
  constructor(
    private readonly cart: CartService,
    private readonly catalog: CatalogService,
    private readonly ordersService: OrdersService,
  ) {}

  // ---------- оформление (публичные эндпоинты контракта) ----------

  @Get("shipping-methods")
  async shippingMethods() {
    return {
      data: (await this.ordersService.shippingMethods()).map((m) => ({
        code: m.code,
        name: m.name,
        price: Number(m.price),
        etaDays: m.etaDays,
      })),
    };
  }

  @Post("promo/validate")
  @HttpCode(200)
  validatePromo(@Body() dto: PromoValidateDto) {
    return this.ordersService.validatePromo(dto.code, dto.subtotal);
  }

  // ---------- каталог ----------

  @Get("products")
  listProducts(@Req() req: Request) {
    const q = req.query as Record<string, string | undefined>;
    const num = (v: string | undefined) => (v !== undefined && v !== "" ? Number(v) : undefined);
    return this.catalog.list({
      page: num(q.page),
      perPage: num(q.perPage),
      category: q.category,
      seller: q.seller,
      q: q.q,
      priceMin: num(q.price_min),
      priceMax: num(q.price_max),
      sort: (q.sort as "newest" | "oldest" | "price_asc" | "price_desc") ?? "newest",
    });
  }

  @Get("categories")
  categories() {
    return this.catalog.listCategories();
  }

  @Get("products/:id")
  product(@Param("id") id: string) {
    return this.catalog.one(id);
  }

  // ---------- корзина ----------

  private actor(req: Request): Actor {
    const user = (req as Request & { user?: UserEntity }).user;
    return {
      userId: user?.id,
      cartToken: (req.headers["x-cart-token"] as string | undefined) ?? undefined,
    };
  }

  @Get("cart")
  @UseGuards(OptionalJwtAuthGuard)
  async getCart(@Req() req: Request) {
    const { cart } = await this.cart.resolve(this.actor(req));
    return this.cart.view(cart.id);
  }

  @Post("cart/items")
  @UseGuards(OptionalJwtAuthGuard)
  async addItem(@Req() req: Request, @Res({ passthrough: true }) res: any, @Body() dto: AddCartItemDto) {
    const actor = this.actor(req);
    const { cartId, createdToken } = await this.cart.addItem(actor, dto.productId, dto.quantity);
    const token = createdToken ?? actor.cartToken;
    if (!actor.userId && token) res.setHeader("X-Cart-Token", token);
    return this.cart.view(cartId);
  }

  @Patch("cart/items/:id")
  @UseGuards(OptionalJwtAuthGuard)
  async updateItem(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateCartItemDto) {
    const cartId = await this.cart.setQuantity(this.actor(req), id, dto.quantity);
    return this.cart.view(cartId);
  }

  @Delete("cart/items/:id")
  @UseGuards(OptionalJwtAuthGuard)
  async removeItem(@Req() req: Request, @Param("id") id: string) {
    const cartId = (await this.cart.ownedItem(this.actor(req), id)).cart.id;
    await this.cart.removeItem(this.actor(req), id);
    return this.cart.view(cartId);
  }

  @Post("cart/merge")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async merge(@Req() req: Request, @Body() dto: MergeCartDto) {
    const user = (req as Request & { user?: UserEntity }).user!;
    const cartId = await this.cart.merge(user.id, dto.token);
    return this.cart.view(cartId);
  }
}
