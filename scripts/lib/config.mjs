// Единая конфигурация локальной среды. Значения по умолчанию = содержимое .env.example,
// .env переопределяет. Никаких секретов: это локальная демо-среда (AGENTS.md).
import { loadEnv } from "./env.mjs";

loadEnv();

export const config = {
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_DATABASE ?? "polyglot",
    user: process.env.DB_USERNAME ?? "polyglot",
    password: process.env.DB_PASSWORD ?? "secret",
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9002",
    bucket: process.env.S3_BUCKET ?? "products",
    accessKey: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.S3_SECRET_KEY ?? "minioadmin",
  },
  jwtSecret: process.env.JWT_SECRET ?? "change-me-local-dev-secret",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 5),
  wslDistro: process.env.PM_WSL_DISTRO ?? "",
};

export const ROOT = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]):/, (_m, disk) => `${disk.toUpperCase()}:`);
