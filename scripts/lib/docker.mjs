// Обёртка над docker: нативно или через WSL-дистрибутив (ADR-009).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tryCmd, detectWslDistro } from "./exec.mjs";
import { config } from "./config.mjs";
export function dockerRunner() {
  if (tryCmd("docker", ["--version"])) return { kind: "native" };
  if (process.platform === "win32") {
    const distro = config.wslDistro || detectWslDistro();
    if (distro && tryCmd("wsl.exe", ["-d", distro, "-e", "sh", "-c", "docker --version"])) {
      return { kind: "wsl", distro };
    }
  }
  return null;
}

export function dockerRun(runner, args, { stdio = "inherit" } = {}) {
  const argv = runner.kind === "wsl" ? ["-d", runner.distro, "-e", "docker", ...args] : args;
  const cmd = runner.kind === "wsl" ? "wsl.exe" : "docker";
  const r = spawnSync(cmd, argv, { stdio, windowsHide: true });
  if (r.status !== 0) {
    throw new Error(`docker ${args.join(" ")} — код выхода ${r.status}`);
  }
}

export function toWslPath(p) {
  // Прямые и обратные слэши: join() даёт обратные, import.meta.url — прямые.
  return p
    .replace(/^([A-Za-z]):[/\\]/, (_m, disk) => `/mnt/${disk.toLowerCase()}/`)
    .replaceAll("\\", "/");
}

// WSL-гашение: WSL терминирует дистрибутив, когда на Windows-стороне не остаётся
// клиентов (процессы ВНУТРИ VM не считаются — проверено: внутривенный якорь не спасал,
// в journalctl прошлого бута — "InitTerminateInstanceInternal: systemctl poweroff did not
// terminate the instance in 10000 ms"). Поэтому якорь — ОТВЯЗАННЫЙ wsl.exe sleep на
// Windows-стороне: держит клиент-сессию, пока infra считается поднятой.

const anchorPidFile = join(import.meta.dirname, "..", "..", ".infra", "wsl-alive.pid");

export function keepWslAlive(distro) {
  if (process.platform !== "win32") return;
  if (aliveAnchorRunning()) return;
  // detached+unref: переживает завершение infra.mjs; держит WSL-сессию клиента
  const child = spawn("wsl.exe", ["-d", distro, "--exec", "sleep", "infinity"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  writeFileSync(anchorPidFile, String(child.pid));
  // внутривенный цикл оставляем как вторую линию обороны (безвреден)
  spawnSync("wsl.exe", [
    "-d",
    distro,
    "-e",
    "sh",
    "-c",
    'setsid nohup sh -c "while :; do sleep 3600; done" >/dev/null 2>&1 </dev/null &',
  ], { windowsHide: true });
}

export function stopWslAlive() {
  if (!existsSync(anchorPidFile)) return;
  const pid = Number(readFileSync(anchorPidFile, "utf8").trim());
  if (Number.isFinite(pid) && pid > 0) {
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore", shell: true });
    } catch {
      /* уже мёртв */
    }
  }
  unlinkSync(anchorPidFile);
}

function aliveAnchorRunning() {
  if (!existsSync(anchorPidFile)) return false;
  const pid = Number(readFileSync(anchorPidFile, "utf8").trim());
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    unlinkSync(anchorPidFile);
    return false;
  }
}
