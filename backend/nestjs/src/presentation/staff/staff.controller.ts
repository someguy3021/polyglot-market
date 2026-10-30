// Тонкий HTTP-слой: парсинг query/Body, гарды, делегация в StaffService (application).
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard, Roles } from "../guards/roles.guard";
import { StaffService } from "../../application/staff/staff.service";
import { PromoCodeInputDto, RejectDto, RoleDto } from "../../application/staff/staff.dto";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  // ---------- модерация ----------

  @Get("moderator/queue")
  @Roles("moderator", "admin")
  queue(@Query("page") page = "1", @Query("perPage") perPage = "20") {
    return this.staff.queue(Number(page), Math.min(100, Number(perPage)));
  }

  @Post("moderator/products/:id/approve")
  @HttpCode(200)
  @Roles("moderator", "admin")
  approve(@Param("id") id: string) {
    return this.staff.approve(id);
  }

  @Post("moderator/products/:id/reject")
  @HttpCode(200)
  @Roles("moderator", "admin")
  reject(@Param("id") id: string, @Body() dto: RejectDto) {
    return this.staff.reject(id, dto);
  }

  // ---------- админ ----------

  @Put("admin/users/:id/role")
  @Roles("admin")
  updateUserRole(@Param("id") id: string, @Body() dto: RoleDto) {
    return this.staff.updateUserRole(id, dto);
  }

  @Get("admin/users")
  @Roles("admin")
  users(@Query("page") page = "1", @Query("perPage") perPage = "20", @Query("role") role?: string) {
    return this.staff.users(Number(page), Math.min(100, Number(perPage)), role);
  }

  @Get("admin/promo-codes")
  @Roles("admin")
  promoCodes() {
    return this.staff.promoCodes();
  }

  @Post("admin/promo-codes")
  @Roles("admin")
  createPromoCode(@Body() dto: PromoCodeInputDto) {
    return this.staff.createPromoCode(dto);
  }

  @Delete("admin/products/:id")
  @Roles("admin")
  deleteProduct(@Param("id") id: string) {
    return this.staff.deleteProduct(id);
  }
}
