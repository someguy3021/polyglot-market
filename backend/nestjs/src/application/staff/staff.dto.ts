// DTO модерации и админки (входные модели use-cases staff-слоя).
import { IsIn, IsString, MinLength } from "class-validator";

export class RejectDto {
  @IsString()
  @MinLength(4)
  reason!: string;
}

export class RoleDto {
  @IsIn(["buyer", "seller", "moderator", "admin"])
  role!: "buyer" | "seller" | "moderator" | "admin";
}

export interface PromoCodeInputDto {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  maxUses?: number;
  expiresAt?: string;
}
