// pnpm docker:up --front=react --back=nestjs — комбо «1 фронт + 1 бекенд + infra» (ADR-007).
// Рендерит override-композ из шаблонов и поднимает ровно 4 контейнера.
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dockerRunner, dockerRun, keepWslAlive, toWslPath } from "./lib/docker.mjs";

const ROOT = join(import.meta.dirname, "..");
const front = (process.argv.find((a) => a.startsWith("--front=")) ?? "").split("=")[1];
const back = (process.argv.find((a) => a.startsWith("--back=")) ?? "").split("=")[1];
const down = process.argv.includes("--down");

const FRONT_PORTS = { quasar: 9000, vue2: 9001, angular: 4200, react: 3001, nuxt: 3002, next: 3003, sveltekit: 3004 };
const BACK_PORTS = { laravel: 8000, nestjs: 3000 };
// какой Dockerfile у каждого фронта и какой порт внутри контейнера
const FRONT_DOCKER = {
  react: { dockerfile: "frontend/react/Dockerfile", containerPort: 80 },
  quasar: { dockerfile: "frontend/quasar/Dockerfile", containerPort: 80 },
  vue2: { dockerfile: "frontend/vue2/Dockerfile", containerPort: 80 },
  angular: { dockerfile: "frontend/angular/Dockerfile", containerPort: 80 },
  nuxt: { dockerfile: "frontend/nuxt/Dockerfile", containerPort: 3000 },
  next: { dockerfile: "frontend/next/Dockerfile", containerPort: 3000 },
  sveltekit: { dockerfile: "frontend/sveltekit/Dockerfile", containerPort: 3000 },
};

if (!front || !back) {
  console.log("использование: pnpm docker:up --front=<имя> --back=<имя> | pnpm docker:down");
  process.exit(1);
}
if (!FRONT_PORTS[front] || !BACK_PORTS[back]) {
  console.error(`неизвестная пара: ${front} × ${back}`);
  process.exit(1);
}

const runner = dockerRunner();
if (!runner) {
  console.error("docker недоступен — запустите pnpm doctor");
  process.exit(1);
}
if (runner.kind === "wsl") keepWslAlive(runner.distro);

const hostFrontPort = FRONT_PORTS[front];
const hostBackPort = BACK_PORTS[back];
const buildFrom = (p) => (runner.kind === "wsl" ? toWslPath(join(ROOT, p)) : p);

// ADR-007: ровно 4 контейнера — postgres, minio, бекенд, фронт. Никогда «всё сразу».
const composeYaml = `
services:
  ${back}:
    build:
      context: ..
      dockerfile: ${back === "laravel" ? "backend/laravel/Dockerfile" : "backend/nestjs/Dockerfile"}
    environment:
      DB_HOST: host.docker.internal
      DB_PORT: "5432"
      DB_DATABASE: polyglot
      DB_USERNAME: polyglot
      DB_PASSWORD: secret
      JWT_SECRET: dev-only-secret-change-me-0123456789-abcdef-secret-change-me
      PORT: "${BACK_PORTS[back]}"
      S3_ENDPOINT: http://host.docker.internal:9002
      S3_BUCKET: products
      S3_ACCESS_KEY: minioadmin
      S3_SECRET_KEY: minioadmin
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "${hostBackPort}:${BACK_PORTS[back]}"
  ${front}:
    build:
      context: ..
      dockerfile: ${FRONT_DOCKER[front].dockerfile}
    environment:
      API_URL: http://localhost:${hostBackPort}${front === "nuxt" || front === "next" || front === "sveltekit" ? `
      NUXT_PUBLIC_API_URL: http://localhost:${hostBackPort}
      NEXT_PUBLIC_API_URL: http://localhost:${hostBackPort}` : ""}
    ports:
      - "${hostFrontPort}:${FRONT_DOCKER[front].containerPort}"
`;

const comboFile = join(ROOT, "infra", "docker-compose.combo.yml");
writeFileSync(comboFile, composeYaml);
const comboWsl = runner.kind === "wsl" ? toWslPath(comboFile) : comboFile;

if (down) {
  dockerRun(runner, ["compose", "-f", comboWsl, "down"]);
  console.log("combo: остановлено.");
  process.exit(0);
}

function composePath() {
  const infra = join(ROOT, "infra", "docker-compose.infra.yml");
  return runner.kind === "wsl" ? toWslPath(infra) : infra;
}

if (!existsSync(join(ROOT, ".infra", "s3-dev.pid"))) {
  try { execFileSync("node", [join(ROOT, "scripts", "infra.mjs"), "up"], { stdio: "inherit", shell: process.platform === "win32" }); } catch {}
}
console.log(`combo: сборка и подъём ${front}(:${hostFrontPort}) × ${back}(:${hostBackPort}) + postgres + minio…`);
dockerRun(runner, ["compose", "-f", comboWsl, "up", "-d", "--build", "--wait"], { stdio: "inherit" });
console.log(`\n✅ комбо готово: фронт http://localhost:${hostFrontPort} · API http://localhost:${hostBackPort}`);
console.log(`down: pnpm docker:down`);
