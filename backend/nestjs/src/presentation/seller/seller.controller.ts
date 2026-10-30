import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadedFile, UseInterceptors } from "@nestjs/common";
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard, Roles } from "../guards/roles.guard";
import { SellerService, type ProductInput } from "../../application/seller/seller.service";
import type { UserEntity } from "../../domain/entities/user.entity";

export class ProductInputValidator implements ProductInput {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  price!: number;

  @IsOptional()
  @Min(0)
  stock?: number;

  @IsUUID()
  categoryId!: string;
}

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
  @IsString()
  code!: string;

  @IsIn(["percent", "fixed"])
  type!: "percent" | "fixed";

  @IsNumber()
  @Min(0.01)
  value!: number;

  @IsOptional()
  @Min(0)
  minSubtotal?: number;

  @IsOptional()
  maxUses?: number;

  @IsOptional()
  expiresAt?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class SellerController {
  constructor(private readonly seller: SellerService) {}

  private self(req: Request): UserEntity {
    return (req as Request & { user?: UserEntity }).user!;
  }

  // ---------- продавец ----------

  @Get("seller/products")
  myProducts(@Req() req: Request, @Query("page") page?: string, @Query("perPage") perPage?: string) {
    return this.seller.listMine(this.self(req).id, Number(page ?? 1), Math.min(100, Number(perPage ?? 20)));
  }

  @Post("seller/products")
  @UseGuards(RolesGuard)
  @Roles("seller")
  createProduct(@Req() req: Request, @Body() dto: ProductInputValidator) {
    return this.seller.create(this.self(req).id, dto);
  }

  @Put("seller/products/:id")
  updateProduct(@Req() req: Request, @Param("id") id: string, @Body() dto: ProductInputValidator) {
    return this.seller.update(this.self(req).id, id, dto);
  }

  @Post("seller/products/:id/submit")
  @HttpCode(200)
  submitProduct(@Req() req: Request, @Param("id") id: string) {
    return this.seller.submit(this.self(req).id, id);
  }

  @Post("seller/products/:id/images")
  @UseInterceptors(FileInterceptor("file"))
  uploadImage(
    @Req() req: Request,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.seller.uploadImage(this.self(req).id, id, file);
  }

  @Delete("seller/products/:id/images/:imageId")
  deleteImage(@Req() req: Request, @Param("id") id: string, @Param("imageId") imageId: string) {
    return this.seller.deleteImage(this.self(req).id, id, imageId);
  }

  @Get("seller/order-items")
  orderItems(@Req() req: Request, @Query("page") page?: string, @Query("perPage") perPage?: string) {
    return this.seller.listOrderItems(this.self(req).id, Number(page ?? 1), Math.min(100, Number(perPage ?? 20)));
  }
}
