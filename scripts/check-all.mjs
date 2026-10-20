// pnpm check:all — полный локальный прогон всех проверок одной командой (аналог CI).
// Пропускает шаги, которым не хватает окружения (нет Laravel / не поднят бекенд).
import { spawnSync } from "node:child_process";

const steps = [];
const run = (name, cmd, args, opts = {}) => ({ name, cmd, args, opts, kind: "spawn" });
const skip = (name, reason) => ({ name, kind: "skip", reason });

// 1. Линт контракта
steps.push(run("spectral", "pnpm", ["--dir", "packages/conformance", "run", "lint:spec"]));

// 2. Юниты Laravel (нужен PHP)
const php = spawnSync("php", ["--version"], { encoding: "utf8", shell: process.platform === "win32" });
if (php.status === 0) {
  steps.push(run("laravel: юниты", "php", ["vendor/bin/phpunit", "tests/Unit"], { cwd: "backend/laravel" }));
} else {
  steps.push(skip("laravel: юниты", "PHP не найден"));
}

// 3. Юниты NestJS
steps.push(run("nestjs: юниты", "pnpm", ["--dir", "backend/nestjs", "test"]));

// 4. Conformance — нужен живой бекенд (8010 laravel / 3000 nest / 8000 nest)
const probes = [
  ["laravel :8010", "http://127.0.0.1:8010"],
  ["nestjs :3000", "http://127.0.0.1:3000"],
];
const { execSync } = await import("node:child_process");
let conformanceBase = null;
for (const [label, url] of probes) {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) { conformanceBase = url; console.log(`конформанс против ${label}`); break; }
  } catch { /* следующий */ }
}
if (conformanceBase) {
  steps.push(run("conformance", "pnpm", ["conformance"], {
    env: { ...process.env, CONFORMANCE_BASE_URL: conformanceBase },
  }));
} else {
  steps.push(skip("conformance", "живой бекенд не найден на :8010/:3000 — подними и перезапусти"));
}

// 5. E2E — нужен фронт (9000 quasar / 3001 react)
let e2eFront = null;
for (const port of [9000, 3001]) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) { e2eFront = `http://127.0.0.1:${port}`; break; }
  } catch { /* следующий */ }
}
if (e2eFront) {
  // чистые сиды перед E2E (фича 14: «Инфраструктура прогона: сиды с нуля»)
  steps.push(run("db:reset (сиды с нуля)", "node", ["scripts/db.mjs", "reset"]));
  // прогрев: первый запрос триггерит vite-компиляцию, без него каталог не успевает за таймаутом
  steps.push(run("e2e: прогрев фронта", "node", ["scripts/lib/warm-front.mjs", e2eFront]));
  // каждый фронт гоняет свой файл спеков (селекторы фреймворк-специфичны)
  const specByFront = { 9000: "buyer.quasar", 3001: "buyer.react" };
  const frontPort = Number(new URL(e2eFront).port);
  const spec = specByFront[frontPort] ?? "buyer.quasar";
  steps.push(run("e2e", "pnpm", ["--dir", "packages/e2e", "test", "specs/" + spec + ".spec.ts"], {
    env: { ...process.env, E2E_FRONT_URL: e2eFront },
  }));
} else {
  steps.push(skip("e2e", "фронт не найден на :9000/:3001 — подними и перезапусти"));
}

let failed = 0;
for (const step of steps) {
  if (step.kind === "skip") {
    console.log(`  ⏭  ${step.name} — ${step.reason}`);
    continue;
  }
  console.log(`  ▶ ${step.name}`);
  const r = spawnSync(step.cmd, step.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: step.opts?.cwd ?? process.cwd(),
    env: { ...process.env, ...step.opts?.env },
  });
  if (r.status !== 0) {
    console.log(`  ✗ ${step.name} — упал`);
    failed++;
  }
}
console.log(failed === 0 ? "\n✅ check:all — все проверки зелёные" : `\n✗ упавших шагов: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
