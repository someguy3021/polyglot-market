import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "./auth.module";
import { HealthController } from "./presentation/health.controller";
import { MetricsController } from "./presentation/metrics/metrics.controller";
import { ShopController } from "./presentation/cart/shop.controller";
import { CartService } from "./application/cart/cart.service";
import { CatalogService } from "./application/catalog/catalog.service";
import { OrdersController } from "./presentation/orders/orders.controller";
import { OrdersService } from "./application/orders/orders.service";
import { SellerController } from "./presentation/seller/seller.controller";
import { SellerService } from "./application/seller/seller.service";
import { StaffController } from "./presentation/staff/staff.controller";
import { StaffService } from "./application/staff/staff.service";
import { IMAGE_STORAGE_PROVIDER } from "./infrastructure/s3/s3.storage";
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
} from "./domain/entities/shop.entities";

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
  providers: [CartService, CatalogService, OrdersService, SellerService, StaffService, IMAGE_STORAGE_PROVIDER],
})
export class AppModule {}
