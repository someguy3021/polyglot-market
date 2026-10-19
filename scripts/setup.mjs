// pnpm setup — явная оркестрация первичной настройки (ADR-003): install, env, composer, миграции, сиды.
// Каждый шаг можно повторять: setup идемпотентен.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: "inherit", cwd: ROOT, shell: process.platform === "win32", ...opts });

console.log("setup 1/5: зависимости воркспейса (pnpm install)…");
run("pnpm", ["install"]);

console.log("setup 2/5: окружение (.env из примера, если нет)…");
if (!existsSync(join(ROOT, ".env"))) {
  copyFileSync(join(ROOT, ".env.example"), join(ROOT, ".env"));
  console.log("  создан .env из .env.example");
}

console.log("setup 3/5: инфраструктура (postgres + minio)…");
run("node", ["scripts/infra.mjs", "up"]);

console.log("setup 4/5: схема БД (миграции)…");
run("node", ["scripts/db.mjs", "migrate"]);

console.log("setup 5/5: сиды (демо-аккаунты, товары, картинки)…");
run("node", ["scripts/db.mjs", "seed"]);

console.log("\n\x1b[32msetup: готово. Дальше: `pnpm start` — панель управления.\x1b[0m");
console.log("Laravel-бекенд потребует `composer install` в backend/laravel (см. его README).");
