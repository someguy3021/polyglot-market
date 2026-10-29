// s3rver внутри k8s-стенда: тот же S3 API, что и dev-fallback на хосте
// (scripts/lib/s3-dev.mjs). Ключи — из env (Secret polyglot-secrets), каталог — /data.
import { createRequire } from "node:module";
import S3rver from "s3rver";

// s3rver 3.x хардкодит единственный аккаунт S3RVER/S3RVER — регистрируем наш ключ,
// чтобы потребители (seed с хоста, NestJS в кластере) не чувствовали режим хранилища.
const require = createRequire(import.meta.url);
const AWSAccount = require("s3rver/lib/models/account");
new AWSAccount("pm-s3rver", "polyglot-market k8s dev storage").createKeyPair(
  process.env.S3_ACCESS_KEY ?? "minioadmin",
  process.env.S3_SECRET_KEY ?? "minioadmin",
);

const port = Number(process.env.PORT ?? 9000);
const server = new S3rver({
  port,
  address: "0.0.0.0",
  directory: "/data",
  silent: true,
});

await server.run();
console.log(`s3rver: слушает 0.0.0.0:${port}, данные: /data`);
