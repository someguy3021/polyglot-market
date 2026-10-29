import { readFileSync, writeFileSync, existsSync, cpSync, mkdirSync } from "fs";
import { execSync } from "node:child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Фабрика экстрактов (фича 16, ADR-010): pnpm extract --front=X --back=Y --out=DIR [--ci] [--dry-run]
// [--no-git] [--no-lockfile]. Генерирует автономный репозиторий «1 фронт + 1 бекенд» из мегарепы:
// свой package.json/README/workspace, опциональный CI, свой lockfile (pnpm install --lockfile-only),
// git init с честным initial commit (история не фальсифицируется).

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const front = arg("front");
const back = arg("back");
const out = arg("out", `../${front}-${back}-demo`);
const dryRun = hasFlag("dry-run");
const withCi = hasFlag("ci");

if (!front || !back) {
  console.log("использование: pnpm extract --front=<react|quasar|...> --back=<laravel|nestjs> [--out=DIR] [--ci] [--dry-run] [--no-git] [--no-lockfile]");
  process.exit(1);
}

const copyPlan = [
  { from: `frontend/${front}`, to: "frontend", rename: front },
  { from: `backend/${back}`, to: "backend", rename: back },
  { from: "shared/api-spec", to: "shared/api-spec" },
  { from: "shared/db", to: "shared/db" },
  { from: "packages/api-client", to: "packages/api-client" },
  { from: "infra", to: "infra" },
  { from: "panel", to: "panel" },
];

// Скрипты: только нужные фронту/бекенду файлы (без panel-менеджера мегарепы)
const scriptFiles = ["doctor.mjs", "setup.mjs", "infra.mjs", "db.mjs", "generate-clients.mjs"];
const libFiles = ["env.mjs", "config.mjs", "pg.mjs", "exec.mjs", "docker.mjs", "s3-dev.mjs", "wsl-bridge.mjs"];

const needsPhp = back === "laravel";
const needsJava = false; // SDK в git, перегенерация — опция мейнтейнера

const filesToCopy = [];
for (const { from, to, rename } of copyPlan) {
  filesToCopy.push({ from: join(ROOT, from), to: join(out, to, rename ?? "") });
}
for (const f of scriptFiles) filesToCopy.push({ from: join(ROOT, "scripts", f), to: join(out, "scripts", f) });
for (const f of libFiles) filesToCopy.push({ from: join(ROOT, "scripts", "lib", f), to: join(out, "scripts", "lib", f) });
filesToCopy.push({ from: join(ROOT, ".env.example"), to: join(out, ".env.example") });
filesToCopy.push({ from: join(ROOT, ".gitignore"), to: join(out, ".gitignore") });
filesToCopy.push({ from: join(ROOT, ".spectral.yaml"), to: join(out, ".spectral.yaml") });
filesToCopy.push({ from: join(ROOT, "LICENSE"), to: join(out, "LICENSE") });

console.log(`Экстракт: ${front} + ${back} → ${out}${dryRun ? " (dry-run)" : ""}`);

if (dryRun) {
  for (const f of filesToCopy) console.log(`  копировать: ${f.from.replace(ROOT, ".")} → ${f.to.replace(out, "")}/`);
  process.exit(0);
}


for (const { from, to } of filesToCopy) {
  if (!existsSync(from)) {
    console.warn(`пропуск (нет источника): ${from}`);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

// Корневой package.json экстракта: имя + только нужные скрипты
const megaPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const extractPkg = {
  name: `${front}-${back}-demo`,
  version: "1.0.0",
  private: true,
  description: `Полнофункциональный интернет-магазин: ${front} + ${back}. Экстракт Polyglot Market (один контракт, общий OpenAPI).`,
  packageManager: megaPkg.packageManager,
  engines: megaPkg.engines,
  scripts: {
    doctor: "node scripts/doctor.mjs",
    setup: "node scripts/setup.mjs",
    "infra:up": "node scripts/infra.mjs up",
    "infra:down": "node scripts/infra.mjs down",
    "db:migrate": "node scripts/db.mjs migrate",
    "db:seed": "node scripts/db.mjs seed",
    start: needsPhp
      ? "node scripts/serve-backend.mjs"
      : "cd backend/" + back + " && node dist/main.js",
    lint: "eslint .",
  },
};
writeFileSync(join(out, "package.json"), JSON.stringify(extractPkg, null, 2) + "\n");

// Воркспейс экстракта
const frontWorkspace = front === "react" ? "frontend" : "frontend";
writeFileSync(
  join(out, "pnpm-workspace.yaml"),
  ["packages:", `  - "frontend/${front}"`, `  - "backend/${back}"`, `  - "packages/api-client"`, ""].join("\n"),
);

// README экстракта: самостоятельный проект под стек вакансии
const backTitle = back === "laravel" ? "Laravel 12 (PHP 8.3)" : "NestJS 11 (Node 24)";
const readme = `# ${front} + ${back} — интернет-магазин

Единый OpenAPI-контракт (\`shared/api-spec/openapi.yaml\`) — источник правды для API.
Фронтенд: **${front}**. Бекенд: **${backTitle}**. БД: PostgreSQL. Медиа: S3-совместимое хранилище (MinIO).

## Быстрый старт

\`\`\`bash
pnpm doctor   # проверка окружения
pnpm setup    # инфраструктура (Docker: postgres+minio) + миграции + сиды
pnpm start    # запуск бекенда${needsPhp ? " (php artisan serve :8000)" : " (node dist/main.js :3000)"}
\`\`\`

${needsPhp ? "Бекенд: `cd backend/" + back + " && composer install && php artisan serve --port=8000`\n" : "Бекенд: `cd backend/" + back + " && pnpm install && pnpm build && pnpm start`\n"}
Фронтенд: \`cd frontend/${front} && pnpm install && pnpm dev\`

## Демо-аккаунты

buyer@demo.dev / seller@demo.dev / moderator@demo.dev / admin@demo.dev — пароль \`password\`

## Документация API

\`shared/api-spec/openapi.yaml\` — 38 операций, единый формат ошибок, идемпотентный checkout.

## Лицензия

MIT
`;
writeFileSync(join(out, "README.md"), readme);

// .env экстракта (локальные дефолты, без секретов)
writeFileSync(
  join(out, ".env.example"),
  readFileSync(join(ROOT, ".env.example"), "utf8"),
);

// CI по флагу --ci
if (withCi) {
  mkdirSync(join(out, ".github", "workflows"), { recursive: true });
  writeFileSync(
    join(out, ".github", "workflows", "ci.yml"),
    `name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install
      - run: npx @stoplight/spectral-cli lint shared/api-spec/openapi.yaml
      - run: cd backend/${back} && ${back === "laravel" ? "composer install && vendor/bin/phpunit tests/Unit" : "pnpm install && pnpm build && npx vitest run"}
`,
  );
}

console.log(`✅ Экстракт создан: ${out}`);

// Свой lockfile экстракта (ADR-010): pnpm резолвит workspace-зависимости,
// не скачивая node_modules
if (!hasFlag("no-lockfile")) {
  console.log("lockfile: pnpm install --lockfile-only…");
  execSync("pnpm install --lockfile-only", { cwd: out, stdio: "inherit", shell: process.platform === "win32" });
}

// git init с честным initial commit (ADR-010: история не фальсифицируется)
if (!hasFlag("no-git")) {
  const megaCommit = execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  execSync('git init -b main', { cwd: out, stdio: "ignore", shell: process.platform === "win32" });
  execSync("git add -A", { cwd: out, stdio: "ignore", shell: process.platform === "win32" });
  execSync(
    `git -c user.name="polyglot-extract" -c user.email="extract@demo.dev" commit -m "initial commit: ${front} + ${back} extract from polyglot-market@${megaCommit}"`,
    { cwd: out, stdio: "ignore", shell: process.platform === "win32" },
  );
  console.log(`git: репозиторий инициализирован (источник: polyglot-market@${megaCommit})`);
}
console.log("Дальше: pnpm install внутри экстракта (pull lockfile), pnpm setup, pnpm start.");
