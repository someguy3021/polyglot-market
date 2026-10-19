// Спавн-хелперы. Windows-специфика: pnpm/composer — .cmd/.bat-шимы (нужен shell),
// wsl.exe — прямой спавн без shell, java пишет версию в stderr.
import { spawnSync } from "node:child_process";

const SHELL_CMDS = new Set(["pnpm", "composer", "npm"]);

export function tryCmd(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    windowsHide: true,
    shell: process.platform === "win32" && SHELL_CMDS.has(cmd.replace(/\.(exe|cmd|bat)$/i, "")),
    ...opts,
  });
  const out = `${r.stdout ?? ""}\n${r.stderr ?? ""}`.replace(/\0/g, "").trim();
  return r.status === 0 && out ? out : null;
}

export function detectWslDistro() {
  if (process.platform !== "win32") return "";
  try {
    const r = spawnSync("wsl.exe", ["-l", "-q"], { encoding: "utf16le", windowsHide: true });
    if (r.status !== 0) return "";
    return (r.stdout ?? "").replace(/\0/g, "").split(/\r?\n/).map((s) => s.trim()).find((s) => s && !/^windows/i.test(s)) ?? "";
  } catch {
    return "";
  }
}
