// pnpm generate:clients — перегенерация клиентов из openapi.yaml (ADR-04).
// Требует Java; сгенерированное коммитится, поэтому рекрутеру этот скрипт не нужен.
import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SPEC = join(ROOT, "shared", "api-spec", "openapi.yaml");

const targets = [
  {
    name: "typescript-axios (@showcase/api-client)",
    generator: "typescript-axios",
    out: join(ROOT, "packages", "api-client", "src", "generated"),
    extra: [
      "-p",
      "withInterfaces=true,supportsES6=true,packageName=@showcase/api-client,npmName=@showcase/api-client,npmVersion=1.0.0,enumPropertyNaming=original",
    ],
  },
  {
    name: "typescript models (NestJS DTO)",
    generator: "typescript",
    out: join(ROOT, "backend", "nestjs", "src", "generated"),
    extra: ["-p", "withInterfaces=true,enumPropertyNaming=original"],
  },
];

console.log("Проверка Java…");
const java = spawnSync("java", ["-version"], { encoding: "utf8", windowsHide: true });
if (java.status !== 0) {
  console.error("Java недоступна — перегенерация невозможна (сгенерированный код уже в git, ADR-004).");
  process.exit(1);
}

let failed = false;
for (const t of targets) {
  console.log(`\nГенерация: ${t.name}…`);
  if (existsSync(t.out)) rmSync(t.out, { recursive: true, force: true });
  const r = spawnSync(
    "pnpm",
    [
      "dlx",
      "@openapitools/openapi-generator-cli@2.13.0",
      "generate",
      "-i",
      SPEC,
      "-g",
      t.generator,
      "-o",
      t.out,
      "--skip-validate-spec",
      ...t.extra,
    ],
    { stdio: "inherit", shell: process.platform === "win32", cwd: ROOT, windowsHide: true },
  );
  if (r.status !== 0) {
    console.error(`Генерация ${t.name} не удалась.`);
    failed = true;
  }
}

console.log(failed ? "\n\x1b[31mgenerate:clients: есть ошибки.\x1b[0m" : "\n\x1b[32mgenerate:clients: готово — закоммитьте изменения packages/api-client.\x1b[0m");
process.exit(failed ? 1 : 0);
