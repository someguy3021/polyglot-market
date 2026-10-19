// pnpm infra:up|down|reset|status — инфраструктура (postgres + S3-хранилище).
// Канонический путь: docker compose (postgres + minio). Если образ MinIO не пуллится
// (ограниченная сеть) — postgres-контейнер + встроенный S3 dev-сервер на том же :9002 (ADR-008).
// Плюс: если WSL2 localhost-forwarding не зарегистрировал порт на Windows — TCP-мост
// на WSL IP (скрипты/lib/wsl-bridge.mjs), чтобы 127.0.0.1:<port> работал всегда.
import { spawn, execSync } from "node:child_process";
import { createConnection } from "node:net";
import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync, openSync } from "node:fs";
import { join } from "node:path";
import { dockerRunner, dockerRun, toWslPath, keepWslAlive } from "./lib/docker.mjs";
import { tryCmd } from "./lib/exec.mjs";

const ROOT = join(import.meta.dirname, "..");
const composeFile = join(ROOT, "infra", "docker-compose.infra.yml");
const infraDir = join(ROOT, ".infra");
const s3DevPid = join(infraDir, "s3-dev.pid");
const s3DevLog = join(infraDir, "s3-dev.log");
const cmd = process.argv[2] ?? "status";
// порты контейнеров, которые должны быть доступны с Windows как 127.0.0.1:<порт>
const FORWARDED_PORTS = [5432];

mkdirSync(infraDir, { recursive: true });

if (!existsSync(composeFile)) {
  console.error("не найден infra/docker-compose.infra.yml");
  process.exit(1);
}

if (cmd === "up") {
  await up();
} else if (cmd === "down") {
  stopS3Dev();
  for (const port of FORWARDED_PORTS) stopBridge(port);
  const runner = dockerRunner();
  if (runner) dockerRun(runner, ["compose", "-f", composePath(runner), "down"]);
  console.log("infra: остановлена (данные сохранены).");
} else if (cmd === "reset") {
  stopS3Dev();
  for (const port of FORWARDED_PORTS) stopBridge(port);
  const runner = dockerRunner();
  if (runner) dockerRun(runner, ["compose", "-f", composePath(runner), "down", "-v"]);
  execSync(`rm -rf "${join(infraDir, "s3-data")}"`, { shell: true });
  console.log("infra: остановлена, volumes и данные S3 удалены.");
} else if (cmd === "status") {
  const runner = dockerRunner();
  if (runner) dockerRun(runner, ["compose", "-f", composePath(runner), "ps"]);
  console.log(s3DevRunning() ? "s3-dev: запущен (fallback-режим)" : "s3-dev: не запущен");
  for (const port of FORWARDED_PORTS) {
    console.log(`bridge:${port}: ${bridgeRunning(port) ? "запущен" : "не запущен"}`);
  }
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
  if (runner.kind === "wsl") keepWslAlive(runner.distro);
  try {
    dockerRun(runner, ["compose", "-f", composePath(runner), "up", "-d", "--wait"]);
    console.log("infra: postgres :5432, minio api :9002 (console :9003) — готовы (docker).");
  } catch (err) {
    console.warn(`\x1b[33minfra: docker compose не поднялся (${err.message.split("\n")[0]}).\x1b[0m`);
    // Fallback: postgres-контейнер + встроенный S3 (s3rver) на том же :9002.
    dockerRun(runner, ["compose", "-f", composePath(runner), "up", "-d", "--wait", "postgres"]);
    startS3Dev();
    console.log("\x1b[33minfra: postgres :5432 (docker) + S3 dev-сервер :9002 (встроенный fallback).\x1b[0m");
    console.log("S3 работает в dev-режиме (s3rver): для MinIO настройте docker pull на этой машине.");
  }
  for (const port of FORWARDED_PORTS) {
    await ensureForward(runner, port);
  }
}

// --- Проброс портов WSL → Windows (мост при сломанном localhost-forwarding) ---

async function ensureForward(runner, port) {
  if (await portOpen(port)) {
    console.log(`forward: 127.0.0.1:${port} — нативный WSL-forwarding работает.`);
    return;
  }
  if (runner.kind !== "wsl") throw new Error(`порт ${port} недоступен на Windows`);
  const ip = (tryCmd("wsl.exe", ["-d", runner.distro, "-e", "hostname", "-I"]) ?? "")
    .split(/\s+/)[0] ?? "";
  if (!ip) throw new Error("не удалось определить WSL IP для моста");
  stopBridge(port);
  const log = openSync(join(infraDir, `bridge-${port}.log`), "a");
  const child = spawn(process.execPath, [
    join(ROOT, "scripts", "lib", "wsl-bridge.mjs"),
    "--port", String(port),
    "--to", `${ip}:${port}`,
    "--pid-file", join(infraDir, `bridge-${port}.pid`),
  ], { detached: true, stdio: ["ignore", log, log] });
  child.unref();
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (await portOpen(port)) {
      console.log(`\x1b[33mforward: 127.0.0.1:${port} — поднят мост на WSL IP ${ip} (forwarding WSL не работает).\x1b[0m`);
      return;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`мост для порта ${port} не поднялся (см. .infra/bridge-${port}.log)`);
}

function portOpen(port) {
  return new Promise((resolveProbe) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => { socket.destroy(); resolveProbe(true); });
    socket.once("error", () => resolveProbe(false));
    socket.setTimeout(1500, () => { socket.destroy(); resolveProbe(false); });
  });
}

function bridgeRunning(port) {
  const pidFile = join(infraDir, `bridge-${port}.pid`);
  if (!existsSync(pidFile)) return false;
  const pid = Number(readFileSync(pidFile, "utf8").trim());
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function stopBridge(port) {
  const pidFile = join(infraDir, `bridge-${port}.pid`);
  if (!existsSync(pidFile)) return;
  const pid = Number(readFileSync(pidFile, "utf8").trim());
  if (Number.isFinite(pid) && pid > 0) {
    try {
      process.platform === "win32"
        ? execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore", shell: true })
        : process.kill(pid, "SIGTERM");
    } catch {
      /* уже мёртв */
    }
  }
  unlinkSync(pidFile);
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
  void waitForHttp("http://127.0.0.1:9002", 15_000);
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
