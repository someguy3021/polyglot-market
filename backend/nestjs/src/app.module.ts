import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health.controller";
import { MetricsController } from "./metrics/metrics.controller";
import { ShopController } from "./cart/shop.controller";
import { CartService } from "./cart/cart.service";
import { CatalogService } from "./catalog/catalog.service";
import { OrdersController } from "./orders/orders.controller";
import { OrdersService } from "./orders/orders.service";
import { SellerController } from "./seller/seller.controller";
import { SellerService } from "./seller/seller.service";
import { StaffController } from "./staff/staff.controller";
import {
  CartEntity,
  CartItemEntity,
  CategoryEntity,
  IdempotencyKeyEntity,
  OrderEntity,
  OrderItemEntity,
  ProductEntity,
  ProductImageEntity,
  PromoCodeEntity,
  SellerProfileEntity,
  ShippingMethodEntity,
  UserEntity,
} from "./entities/shop.entities";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? "polyglot",
      password: process.env.DB_PASSWORD ?? "secret",
      database: process.env.DB_DATABASE ?? "polyglot",
      // Явный список: глоб `*.entity.js` на этой связке не находил файлы
      entities: [
        UserEntity,
        SellerProfileEntity,
        CategoryEntity,
        ProductEntity,
        ProductImageEntity,
        CartEntity,
        CartItemEntity,
        PromoCodeEntity,
        ShippingMethodEntity,
        OrderEntity,
        OrderItemEntity,
        IdempotencyKeyEntity,
      ],
      // Схема живёт в общих миграциях (ADR-002) — synchronize запрещён.
      synchronize: false,
      logging: false,
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      SellerProfileEntity,
      CategoryEntity,
      ProductEntity,
      ProductImageEntity,
      CartEntity,
      CartItemEntity,
      PromoCodeEntity,
      ShippingMethodEntity,
      OrderEntity,
      OrderItemEntity,
      IdempotencyKeyEntity,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-secret-change-me-0123456789-abcdef-secret-change-me",
      signOptions: { expiresIn: "24h" },
    }),
    AuthModule,
  ],
  controllers: [HealthController, MetricsController, ShopController, OrdersController, SellerController, StaffController],
  providers: [CartService, CatalogService, OrdersService, SellerService],
})
export class AppModule {}
