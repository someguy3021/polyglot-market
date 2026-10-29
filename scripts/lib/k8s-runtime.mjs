// Общий раннер k8s-скриптов (k8s.mjs, k8s-load.mjs): docker в WSL-дистрибутиве
// (win32, ADR-009) или нативно (linux/darwin — CI-раннеры, mac/linux-разработка).
// Тулзы (kind/kubectl/k6) живут в ~/.local/bin — путь добавляется в PATH каждой команде.
import { spawnSync } from "node:child_process";
import { dockerRunner, toWslPath } from "./docker.mjs";

/**
 * @returns {null | {kind:"wsl", distro:string} | {kind:"native"} | {kind:"unsupported"}}
 * docker есть, но нативный на Windows — не поддерживаемая связка (ADR-009).
 */
export function k8sRuntime() {
  const runner = dockerRunner();
  if (!runner) return null;
  if (runner.kind === "native" && process.platform === "win32") return { kind: "unsupported" };
  return runner;
}

/** sh -c внутри WSL-дистрибутива или на хосте. capture → stdout+stderr в out. */
export function sh(runner, script, { capture = false } = {}) {
  const argv = runner.kind === "wsl"
    ? ["-d", runner.distro, "-e", "sh", "-c", `export PATH="$HOME/.local/bin:$PATH"; ${script}`]
    : ["/bin/sh", "-c", `export PATH="$HOME/.local/bin:$PATH"; ${script}`];
  const cmd = runner.kind === "wsl" ? "wsl.exe" : "/bin/sh";
  const r = spawnSync(cmd, argv, {
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    windowsHide: true,
    encoding: "utf8",
  });
  return { status: r.status, out: `${r.stdout ?? ""}\n${r.stderr ?? ""}`.replace(/\0/g, "").trim() };
}

/** sh + throw при неуспехе. opts.stdio:"inherit" — живой вывод долгих операций. */
export function must(runner, script, what, { stdio } = {}) {
  const r = sh(runner, script, { capture: !stdio, stdio });
  if (r.status !== 0) {
    console.error(r.out);
    throw new Error(`${what} — код выхода ${r.status}`);
  }
  return r.out;
}

/** Путь к файлу репы со стороны среды, где исполняется команда. */
export function hostPath(runner, p) {
  return runner.kind === "wsl" ? toWslPath(p) : p;
}

/** Тег платформы для скачивания статических бинарей: окружение исполнения команд —
 *  WSL-дистрибутив всегда linux; нативный раннер — хост (linux/darwin). */
export function toolPlatform(runner) {
  const isWsl = runner?.kind === "wsl";
  const os = isWsl ? "linux" : { linux: "linux", darwin: "darwin" }[process.platform];
  const arch = { x64: "amd64", arm64: "arm64" }[process.arch];
  if (!os || !arch) return null;
  return `${os}-${arch}`;
}
