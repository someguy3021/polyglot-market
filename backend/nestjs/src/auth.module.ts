import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SellerProfileEntity } from "./domain/entities/seller-profile.entity";
import { UserEntity } from "./domain/entities/user.entity";
import { AuthController } from "./presentation/auth/auth.controller";
import { AuthService } from "./application/auth/auth.service";
import { JwtAuthGuard } from "./presentation/auth/jwt-auth.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SellerProfileEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-secret-change-me-0123456789-abcdef-secret-change-me",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
