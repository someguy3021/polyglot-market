import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  OrderEntity,
  OrderItemEntity,
  ProductEntity,
  ProductImageEntity,
} from "../../domain/entities/shop.entities";
import { IMAGE_URL_BASE } from "../config";
import { IMAGE_STORAGE, type ImageStorage } from "../ports";
import { ContractError } from "../../domain/errors/contract.error";

export interface ProductInput {
  title: string;
  description?: string;
  price: number;
  stock?: number;
  categoryId: string;
}

@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity) private readonly images: Repository<ProductImageEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItemRepo: Repository<OrderItemEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
  ) {}

  async listMine(sellerId: string, page: number, perPage: number) {
    const [rows, total] = await this.products.findAndCount({
      where: { sellerId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return {
      data: rows.map((p) => this.serialize(p, [])),
      meta: { currentPage: page, lastPage: Math.max(1, Math.ceil(total / perPage)), perPage, total },
    };
  }

  async create(sellerId: string, input: ProductInput) {
    const product = await this.products.save(
      this.products.create({
        sellerId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description ?? "",
        price: input.price.toFixed(2),
        stock: input.stock ?? 0,
        slug: await this.uniqueSlug(input.title),
        status: "draft",
      }),
    );
    return this.serialize(product, []);
  }

  async update(sellerId: string, id: string, input: ProductInput) {
    const product = await this.own(sellerId, id);
    product.title = input.title;
    product.description = input.description ?? "";
    product.price = input.price.toFixed(2);
    product.stock = input.stock ?? 0;
    product.categoryId = input.categoryId;
    // Контракт: правка одобренного возвращает товар на доработку
    if (product.status === "approved") product.status = "draft";
    await this.products.save(product);
    return this.serialize(product, await this.images.find({ where: { productId: product.id }, order: { sort: "ASC" } }));
  }

  async submit(sellerId: string, id: string) {
    const product = await this.own(sellerId, id);
    if (!["draft", "rejected"].includes(product.status)) {
      throw new ConflictException("Only draft or rejected products can be submitted.");
    }
    product.status = "pending_moderation";
    product.rejectionReason = null;
    await this.products.save(product);
    return this.serialize(product, await this.images.find({ where: { productId: product.id }, order: { sort: "ASC" } }));
  }

  async uploadImage(sellerId: string, id: string, file: Express.Multer.File | undefined) {
    const product = await this.own(sellerId, id);
    if (!file) throw new ContractError(422, "validation_error", "The given data was invalid.", { file: ["file is required"] });
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      throw new ContractError(422, "validation_error", "The given data was invalid.", {
        file: ["Only jpeg/png/webp images are allowed."],
      });
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new ContractError(422, "validation_error", "The given data was invalid.", {
        file: ["Image exceeds 5 MB."],
      });
    }

    const uuid = randomUUID();
    const ext = file.mimetype === "image/png" ? "png" : file.mimetype === "image/webp" ? "webp" : "jpg";
    const key = `${product.id}/${uuid}.${ext}`;
    const thumbKey = `${product.id}/${uuid}-thumb.png`;

    await this.storage.put(key, file.buffer, file.mimetype);
    const thumb = await sharp(file.buffer).resize(320, 240, { fit: "inside" }).png().toBuffer();
    await this.storage.putPng(thumbKey, thumb);

    const count = await this.images.count({ where: { productId: product.id } });
    const image = await this.images.save(
      this.images.create({
        productId: product.id,
        key,
        thumbKey,
        isPrimary: count === 0,
        sort: count,
      }),
    );
    return { id: image.id, url: `${IMAGE_URL_BASE}/${image.key}`, thumbUrl: `${IMAGE_URL_BASE}/${image.thumbKey}`, isPrimary: image.isPrimary };
  }

  async deleteImage(sellerId: string, id: string, imageId: string) {
    const product = await this.own(sellerId, id);
    const image = await this.images.findOneBy({ id: imageId, productId: product.id });
    if (!image) throw new NotFoundException("Image not found.");
    for (const key of [image.key, image.thumbKey]) {
      if (key) await this.storage.remove(key);
    }
    await this.images.remove(image);
  }

  async listOrderItems(sellerId: string, page: number, perPage: number) {
    const [rows, total] = await this.orderItemRepo.findAndCount({
      where: { sellerId },
      order: { id: "ASC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    const data = [];
    for (const item of rows) {
      const order = await this.orders.findOneByOrFail({ id: item.orderId });
      data.push({
        id: item.id,
        orderId: item.orderId,
        orderStatus: order.status,
        productTitle: item.title,
        title: item.title,
        price: Number(item.price),
        quantity: item.quantity,
        createdAt: order.createdAt?.toISOString?.() ?? null,
      });
    }
    return {
      data,
      meta: { currentPage: page, lastPage: Math.max(1, Math.ceil(total / perPage)), perPage, total },
    };
  }

  private async own(sellerId: string, id: string): Promise<ProductEntity> {
    const product = await this.products.findOneBy({ id });
    // Чужой товар не раскрываем: как не найденный (паритет с Laravel)
    if (!product || product.sellerId !== sellerId) throw new NotFoundException("Product not found.");
    return product;
  }

  private serialize(p: ProductEntity, images: ProductImageEntity[]) {
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      stock: p.stock,
      status: p.status,
      rejectionReason: p.rejectionReason,
      categoryId: p.categoryId,
      images: images.map((i) => ({
        id: i.id,
        url: `${IMAGE_URL_BASE}/${i.key}`,
        thumbUrl: i.thumbKey ? `${IMAGE_URL_BASE}/${i.thumbKey}` : null,
        isPrimary: i.isPrimary,
      })),
      createdAt: p.createdAt?.toISOString?.() ?? null,
      updatedAt: p.updatedAt?.toISOString?.() ?? null,
    };
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    let slug = base;
    let i = 2;
    while (await this.products.findOneBy({ slug })) slug = `${base}-${i++}`;
    return slug;
  }
}

