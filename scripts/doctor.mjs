// pnpm doctor — проверка окружения. Ошибки блокируют, всё остальное — предупреждения (ADR-003).
import { tryCmd, detectWslDistro } from "./lib/exec.mjs";
import { config } from "./lib/config.mjs";
import { dockerRunner } from "./lib/docker.mjs";

const ok = (name, detail = "") => console.log(`  \x1b[32m✓\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
const warn = (name, detail = "") => console.log(`  \x1b[33m!\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
const fail = (name, detail = "") => {
  console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
  failed = true;
};
let failed = false;

console.log("Polyglot Market — проверка окружения\n");

const [major] = process.versions.node.split(".").map(Number);
if (major >= 24) ok(`Node.js ${process.versions.node}`);
else if (major >= 22) warn(`Node.js ${process.versions.node}`, "рекомендуется 24 LTS (.nvmrc)");
else fail(`Node.js ${process.versions.node}`, "нужен >= 22");

const pnpm = tryCmd("pnpm", ["--version"]);
if (pnpm) ok("pnpm", pnpm);
else fail("pnpm", "установите: corepack enable || npm i -g pnpm");

// Docker: нативно или через WSL (ADR-009)
const runner = dockerRunner();
if (runner?.kind === "native") ok("Docker", "нативно");
else if (runner?.kind === "wsl") ok(`Docker (WSL: ${runner.distro})`);
else fail("Docker", "поднимите Docker Desktop или установите docker в WSL2");

// PHP/Composer — нужны только для Laravel-бекенда
const php = tryCmd("php", ["--version"]);
if (php) ok("PHP", php.split("\n")[0]);
else warn("PHP", "не найден — Laravel-бекенд запустить не получится (NestJS работает)");

const composer = tryCmd("composer", ["--version"]);
if (composer) ok("Composer", composer.split("\n")[0].slice(0, 60));
else warn("Composer", "не найден — нужен для Laravel-бекенда");

// Java — только для перегенерации клиентов (ADR-004), рекрутеру не нужна
const java = tryCmd("java", ["-version"]);
if (java) ok("Java", java.split("\n")[0]);
else warn("Java", "не найдена — нужна только для `pnpm generate:clients`");

if (process.platform === "win32" && !runner) {
  const distro = config.wslDistro || detectWslDistro();
  console.log(`\n\x1b[33mWindows-native не поддерживается — используйте WSL2${distro ? ` (дистрибутив найден: ${distro})` : ""} (ADR-009).\x1b[0m`);
}

console.log(failed ? "\n\x1b[31mdoctor: есть блокирующие проблемы.\x1b[0m" : "\n\x1b[32mdoctor: окружение готово.\x1b[0m");
process.exit(failed ? 1 : 0);
