// pnpm infra:up|down|reset|status — инфраструктура (postgres + S3-хранилище).
// Канонический путь: docker compose (postgres + minio). Если образ MinIO не пуллится
// (ограниченная сеть) — postgres-контейнер + встроенный S3 dev-сервер на том же :9002 (ADR-008).
import { spawn, execSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync, openSync } from "node:fs";
import { join } from "node:path";
import { dockerRunner, dockerRun, toWslPath } from "./lib/docker.mjs";
import { tryCmd } from "./lib/exec.mjs";

const ROOT = join(import.meta.dirname, "..");
const composeFile = join(ROOT, "infra", "docker-compose.infra.yml");
const infraDir = join(ROOT, ".infra");
const s3DevPid = join(infraDir, "s3-dev.pid");
const s3DevLog = join(infraDir, "s3-dev.log");
const cmd = process.argv[2] ?? "status";

mkdirSync(infraDir, { recursive: true });

if (!existsSync(composeFile)) {
  console.error("не найден infra/docker-compose.infra.yml");
  process.exit(1);
}

if (cmd === "up") {
  await up();
} else if (cmd === "down") {
  stopS3Dev();
  const runner = dockerRunner();
  if (runner) dockerRun(runner, ["compose", "-f", composePath(runner), "down"]);
  console.log("infra: остановлена (данные сохранены).");
} else if (cmd === "reset") {
  stopS3Dev();
  const runner = dockerRunner();
  if (runner) dockerRun(runner, ["compose", "-f", composePath(runner), "down", "-v"]);
  execSync(`rm -rf "${join(infraDir, "s3-data")}"`, { shell: true });
  console.log("infra: остановлена, volumes и данные S3 удалены.");
} else if (cmd === "status") {
  const runner = dockerRunner();
  if (runner) dockerRun(runner, ["compose", "-f", composePath(runner), "ps"]);
  console.log(s3DevRunning() ? "s3-dev: запущен (fallback-режим)" : "s3-dev: не запущен");
} else {
  console.log("использование: node scripts/infra.mjs up|down|reset|status");
  process.exit(1);
}

function composePath(runner) {
  return runner.kind === "wsl" ? toWslPath(composeFile) : composeFile;
}

async function up() {
  const runner = dockerRunner();
  if (!runner) {
    console.error("docker недоступен — запустите `pnpm doctor`");
    process.exit(1);
  }
  try {
    dockerRun(runner, ["compose", "-f", composePath(runner), "up", "-d", "--wait"]);
    console.log("infra: postgres :5432, minio api :9002 (console :9003) — готовы (docker).");
    return;
  } catch (err) {
    console.warn(`\x1b[33minfra: docker compose не поднялся (${err.message.split("\n")[0]}).\x1b[0m`);
  }
  // Fallback: postgres-контейнер + встроенный S3 (s3rver) на том же :9002.
  dockerRun(runner, ["compose", "-f", composePath(runner), "up", "-d", "--wait", "postgres"]);
  startS3Dev();
  console.log("\x1b[33minfra: postgres :5432 (docker) + S3 dev-сервер :9002 (встроенный fallback).\x1b[0m");
  console.log("S3 работает в dev-режиме (s3rver): для MinIO настройте docker pull на этой машине.");
}

function startS3Dev() {
  if (s3DevRunning()) {
    console.log("s3-dev: уже запущен.");
    return;
  }
  const log = openSync(s3DevLog, "a");
  const child = spawn(process.execPath, [join(ROOT, "scripts", "lib", "s3-dev.mjs")], {
    detached: true,
    stdio: ["ignore", log, log],
    env: { ...process.env },
  });
  child.unref();
  writeFileSync(s3DevPid, String(child.pid));
  waitForHttp("http://127.0.0.1:9002", 15_000);
}

function stopS3Dev() {
  if (!existsSync(s3DevPid)) return;
  const pid = Number(readFileSync(s3DevPid, "utf8").trim());
  if (Number.isFinite(pid) && pid > 0) {
    try {
      process.platform === "win32"
        ? execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore", shell: true })
        : process.kill(pid, "SIGTERM");
    } catch {
      /* уже мёртв */
    }
  }
  unlinkSync(s3DevPid);
}

function s3DevRunning() {
  if (!existsSync(s3DevPid)) return false;
  const pid = Number(readFileSync(s3DevPid, "utf8").trim());
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForHttp(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      /* ещё не поднялся */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`s3-dev не ответил на ${url} за ${timeoutMs}мс`);
}
