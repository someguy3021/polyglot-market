// Мягкая аутентификация (аналог auth.optional в Laravel): валидный JWT →
// req.user, невалидный/отсутствующий → гость. Никогда не бросает 401.
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../entities/user.entity";

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: UserEntity }>();
    try {
      const header = request.headers.authorization ?? "";
      const [scheme, token] = header.split(" ");
      if (scheme === "Bearer" && token) {
        const payload = await this.jwt.verifyAsync(token);
        const user = await this.users.findOneBy({ id: payload.sub });
        if (user && !user.blocked) request.user = user;
      }
    } catch {
      // невалидный токен → считаем гостем
    }
    return true;
  }
}
