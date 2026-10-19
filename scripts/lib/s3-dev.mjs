// Встроенный S3 dev-сервер (s3rver) — fallback, когда образ MinIO не пуллится
// (ограниченные сети, см. ADR-008). Тот же S3 API на том же порту :9002.
import { join } from "node:path";
import { createRequire } from "node:module";
import S3rver from "s3rver";
import { config } from "./config.mjs";

const dataDir = join(import.meta.dirname, "..", "..", ".infra", "s3-data");

// s3rver 3.x хардкодит единственный аккаунт S3RVER/S3RVER. Регистрируем наш локальный
// ключ (как у MinIO из compose), чтобы потребители не чувствовали режим хранилища.
// Версия s3rver запинена в lockfile, поэтому глубокий импорт стабилен.
const require = createRequire(import.meta.url);
const AWSAccount = require("s3rver/lib/models/account");
new AWSAccount("minio-dev", "polyglot-market dev storage").createKeyPair(config.s3.accessKey, config.s3.secretKey);

const server = new S3rver({
  port: Number(process.env.S3_PORT ?? new URL(config.s3.endpoint).port),
  address: "127.0.0.1",
  directory: dataDir,
  silent: true,
});

await server.run();
console.log(`s3-dev: слушает 127.0.0.1:${process.env.S3_PORT ?? new URL(config.s3.endpoint).port}, данные: ${dataDir}`);
