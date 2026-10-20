import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { IsIn, IsOptional, IsString, Length, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard, Roles } from "../common/roles.guard";
import { OrdersService, type OrderInputDto } from "./orders.service";
import type { UserEntity } from "../entities/user.entity";

class AddressDto {
  @IsString()
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city!: string;

  @IsString()
  zip!: string;

  @Length(2, 2)
  country!: string;
}

export class OrderInputValidator implements OrderInputDto {
  @IsString()
  shippingMethodCode!: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  // Вложенный DTO обязателен: whitelist вырезает свойства без декораторов
  @Type(() => AddressDto)
  @ValidateNested()
  shippingAddress!: AddressDto;
}

class OrderStatusDto {
  @IsIn(["new", "paid", "shipped", "done", "cancelled"])
  status!: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** 201 при создании, 200 при идемпотентном повторе (ADR-011). */
  @Post("orders")
  async create(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() dto: OrderInputValidator,
  ) {
    const user = (req as Request & { user?: UserEntity }).user!;
    const { status, body } = await this.ordersService.create(user.id, idempotencyKey, dto);
    res.status(status);
    return body;
  }

  @Get("orders")
  listMine(
    @Req() req: Request,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const user = (req as Request & { user?: UserEntity }).user!;
    return this.ordersService.listMine(user.id, Number(page ?? 1), Math.min(100, Number(perPage ?? 20)));
  }

  @Get("orders/:id")
  show(@Req() req: Request, @Param("id") id: string) {
    const user = (req as Request & { user?: UserEntity }).user!;
    return this.ordersService.oneFor(user.id, user.role, id);
  }

  // ---------- админ ----------

  @Get("admin/orders")
  @UseGuards(RolesGuard)
  @Roles("admin")
  adminOrders(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
    @Query("status") status?: string,
  ) {
    return this.ordersService.allForAdmin(Number(page ?? 1), Math.min(100, Number(perPage ?? 20)), status);
  }

  @Put("admin/orders/:id/status")
  @UseGuards(RolesGuard)
  @Roles("admin")
  changeStatus(@Param("id") id: string, @Body() dto: OrderStatusDto) {
    return this.ordersService.changeStatus(id, dto.status);
  }
}
