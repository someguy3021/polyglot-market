// S3-совместимое хранилище (MinIO из infra / dev-fallback s3rver, ADR-008).
import { S3Client } from "@aws-sdk/client-s3";

const ENDPOINT = process.env.S3_ENDPOINT ?? "http://127.0.0.1:9002";
const BUCKET = process.env.S3_BUCKET ?? "products";

export const S3_URL_BASE = `${ENDPOINT}/${BUCKET}`;

export const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: process.env.AWS_DEFAULT_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
  },
});
