// Проверка JWT на защищённых роутах. Секрет общий с Laravel (ADR-004): токен,
// выпущенный одним бекендом, валиден у другого — часть обещания «1 API».
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../../domain/entities/user.entity";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: UserEntity }>();
    const header = request.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Unauthenticated.");
    }
    try {
      const payload = await this.jwt.verifyAsync(token);
      const user = await this.users.findOneBy({ id: payload.sub });
      if (!user || user.blocked) {
        throw new UnauthorizedException("Unauthenticated.");
      }
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException("Unauthenticated.");
    }
  }
}
