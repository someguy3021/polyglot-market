// Ролевой guard: @Roles('seller') + JwtAuthGuard. Роли из общей таблицы users.role.
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../../domain/entities/user.entity";

export type Role = "buyer" | "seller" | "moderator" | "admin";

export const ROLES_KEY = "contract_roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: UserEntity }>();
    const header = request.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) throw new UnauthorizedException("Unauthenticated.");

    // Токен проверяем только на структуру (подпись проверит JwtAuthGuard там, где он стоит);
    // здесь достаточно достать sub и загрузить пользователя.
    let sub: string | undefined;
    try {
      const { JwtService } = await import("@nestjs/jwt");
      const jwt = new JwtService({ secret: process.env.JWT_SECRET ?? "dev-only-secret-change-me-0123456789-abcdef-secret-change-me" });
      sub = (await jwt.verifyAsync(token)).sub;
    } catch {
      throw new UnauthorizedException("Unauthenticated.");
    }
    const user = await this.users.findOneBy({ id: sub });
    if (!user || user.blocked) throw new UnauthorizedException("Unauthenticated.");
    request.user = user;
    if (!required.includes(user.role)) throw new ForbiddenException(`${user.role} role is not allowed here.`);
    return true;
  }
}
