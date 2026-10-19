// Обёртка над docker: нативно или через WSL-дистрибутив (ADR-009).
import { spawnSync } from "node:child_process";
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
  return p
    .replace(/^([A-Za-z]):\\/, (_m, disk) => `/mnt/${disk.toLowerCase()}/`)
    .replaceAll("\\", "/");
}

// WSL-VM гаснет при отсутствии процессов — вместе с ней умирают контейнеры и
// проброс портов. Держим VM живой отвязанным (setsid) вечным sleep-циклом:
// setsid нужен, чтобы якорь пережил завершение запустившего wsl.exe.
export function keepWslAlive(distro) {
  if (process.platform !== "win32") return;
  spawnSync("wsl.exe", [
    "-d",
    distro,
    "-e",
    "sh",
    "-c",
    'setsid nohup sh -c "while :; do sleep 3600; done" >/dev/null 2>&1 </dev/null &',
  ], { windowsHide: true });
}
