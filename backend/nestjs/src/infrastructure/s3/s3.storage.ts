// S3-совместимое хранилище (MinIO из infra / dev-fallback s3rver, ADR-008).
// Clean: адаптер — реализация порта ImageStorage из application/ports;
// строка публичного URL живёт в application/config (IMAGE_URL_BASE).
import { Injectable } from "@nestjs/common";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { IMAGE_STORAGE, type ImageStorage } from "../../application/ports";
import { S3_BUCKET } from "../../application/config";

const ENDPOINT = process.env.S3_ENDPOINT ?? "http://127.0.0.1:9002";

export const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: process.env.AWS_DEFAULT_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
  },
});

@Injectable()
export class S3ImageStorage implements ImageStorage {
  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
  }

  async putPng(key: string, body: Buffer): Promise<void> {
    await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: "image/png" }));
  }

  async remove(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  }
}

/** Провайдер порта для корня композиции (app.module). */
export const IMAGE_STORAGE_PROVIDER = { provide: IMAGE_STORAGE, useClass: S3ImageStorage };
