import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import { UserEntity } from "../../domain/entities/user.entity";
import { ContractError } from "../../domain/errors/contract.error";
import { LoginDto, RegisterDto } from "./auth.dto";

export interface AuthTokenPayload {
  token: string;
  user: PublicUser;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  blocked: boolean;
  shopName: string | null;
  createdAt: string;
}

// $2y-префикс: Laravel принимает только его, bcryptjs читает 2a/2b/2y одинаково.
const toPhpBcrypt = (hash: string) => hash.replace(/^\$2[ab]\$/, "$2y$");

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenPayload> {
    const exists = await this.users.findOneBy({ email: dto.email });
    if (exists) {
      // Формат ошибки контракта: 422 validation_error с полевыми деталями
      throw new ContractError(422, "validation_error", "The given data was invalid.", {
        email: ["The email has already been taken."],
      });
    }
    const user = this.users.create({
      email: dto.email,
      name: dto.name,
      role: "buyer",
      passwordHash: toPhpBcrypt(bcrypt.hashSync(dto.password, 10)),
    });
    await this.users.save(user);
    return this.tokenPayload(user);
  }

  async login(dto: LoginDto): Promise<AuthTokenPayload> {
    const user = await this.users.findOneBy({ email: dto.email });
    if (!user || !bcrypt.compareSync(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid credentials.");
    }
    return this.tokenPayload(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException("Unauthenticated.");
    return this.toPublic(user);
  }

  private tokenPayload(user: UserEntity): AuthTokenPayload {
    return {
      token: this.jwt.sign({ sub: user.id }),
      user: this.toPublic(user),
    };
  }

  private toPublic(user: UserEntity): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      blocked: user.blocked,
      shopName: null, // паритет с Laravel-ресурсом; кабинет продавца — в следующей итерации
      createdAt: user.createdAt.toISOString(),
    };
  }
}
