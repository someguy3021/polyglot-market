// pnpm e2e:matrix — раннер пар фронт × бекенд (фича 14, полная матрица 2×7).
// По умолчанию: полное управление окружением — бекенды поднимаются/гасятся по очереди
// (ADR-006: активен максимум один), между группами — сквозной кейс handoff (create на
// Laravel, verify на NestJS). Каждая пара: db:reset → дев-сервер фронта с адресом API →
// спеки buyer.<front> + roles.<front>.
//   pnpm e2e:matrix                       — полная матрица 14 пар + handoff
//   pnpm e2e:matrix --back=laravel        — одна группа бекенда (7 пар)
//   pnpm e2e:matrix --pairs=9000:8010,4200:3000  — явно выбранные пары
import { execSync, spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const win = process.platform === "win32";

const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? "").split("=").slice(1).join("=");

/** Карта фронтов: порт дев-сервера, команда старта, переменная адреса API, спеки. */
const FRONTS = [
  { port: 9000, name: "quasar",    cwd: "frontend/vue-quasar", args: ["npx", "vite"],                         envKey: "VITE_API_URL",        warmMs: 30_000 },
  { port: 9001, name: "vue2",      cwd: "frontend/vue2",       args: ["npx", "vite"],                         envKey: "VITE_API_URL",        warmMs: 30_000 },
  { port: 3001, name: "react",     cwd: "frontend/react",      args: ["npx", "vite"],                         envKey: "VITE_API_URL",        warmMs: 30_000 },
  { port: 3002, name: "nuxt",      cwd: "frontend/nuxt",       args: ["npx", "nuxt", "dev"],                  envKey: "NUXT_PUBLIC_API_URL", warmMs: 45_000 },
  { port: 3003, name: "next",      cwd: "frontend/next",       args: ["npx", "next", "dev", "-H", "127.0.0.1", "-p", "3003"], envKey: "NEXT_PUBLIC_API_URL", warmMs: 60_000 },
  { port: 3004, name: "sveltekit", cwd: "frontend/sveltekit",  args: ["npx", "vite", "dev"],                  envKey: "VITE_API_URL",        warmMs: 30_000 },
  // Angular CSR: адрес API — только runtime /config.js (окно), пишем его перед ng serve
  { port: 4200, name: "angular",   cwd: "frontend/angular",    args: ["npx", "ng", "serve", "--host", "127.0.0.1", "--port", "4200"], envKey: null, warmMs: 150_000 },
];

const BACKENDS = {
  laravel: { port: 8010, health: "http://127.0.0.1:8010/health" },
  nestjs:  { port: 3000, health: "http://127.0.0.1:3000/health" },
};

const killPort = (port) => {
  try {
    if (win) {
      const pid = execSync(`netstat -ano | findstr ":${port} .*LISTENING"`, { shell: true, encoding: "utf8" })
        .split("\n")[0]?.trim().split(/\s+/).pop();
      if (pid) execSync(`taskkill /PID ${pid} /F /T`, { shell: true, stdio: "ignore" });
    } else {
      execSync(`fuser -k ${port}/tcp`, { shell: true, stdio: "ignore" });
    }
  } catch { /* порт свободен */ }
};

const healthy = async (url) => {
  try { return (await fetch(url, { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; }
};

async function upBackend(name) {
  const b = BACKENDS[name];
  if (await healthy(b.health)) { console.log(`бекенд ${name} уже поднят (:${b.port}) — переиспользуем`); return; }
  killPort(b.port);
  console.log(`поднимаем бекенд ${name} (:${b.port})…`);
  if (name === "nestjs") {
    const build = spawnSync("pnpm", ["--dir", "backend/nestjs", "build"], { stdio: "inherit", shell: win });
    if (build.status !== 0) throw new Error("nestjs build упал");
    spawn("node", ["dist/main.js"], { cwd: "backend/nestjs", stdio: "ignore", shell: win });
  } else {
    spawn("php", ["artisan", "serve", "--port=8010"], { cwd: "backend/laravel", stdio: "ignore", shell: win });
  }
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await healthy(b.health)) return;
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`бекенд ${name} не поднялся за 60с`);
}

function downBackend(name) {
  killPort(BACKENDS[name].port);
}

async function resetDb() {
  // Сид-ноль обязателен: без него тесты падают каскадом 401/пустым каталогом.
  // Раз упало — пробуем поднять инфру (WSL-VM циклится) и повторить один раз.
  const run = () => spawnSync("node", ["scripts/db.mjs", "reset"], { stdio: "inherit", shell: win });
  if (run().status === 0) return true;
  console.error("  db:reset упал — поднимаем инфраструктуру и повторяем…");
  spawnSync("pnpm", ["infra:up"], { stdio: "inherit", shell: win });
  return run().status === 0;
}

async function runPair(front, apiPort, backName) {
  console.log(`\n=== пара ${front.name}(:${front.port}) × ${backName}(:${apiPort}) ===`);
  if (!(await resetDb())) {
    console.error("  ✗ db:reset не прошёл дважды — инфраструктура недоступна, пара пропущена");
    return false;
  }

  killPort(front.port);
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const angularConfig = join(front.cwd, "public", "config.js");
  if (front.name === "angular") {
    writeFileSync(angularConfig, `window.API_URL = "${apiUrl}";\n`);
  }
  const dev = spawn(front.args[0], front.args.slice(1), {
    cwd: front.cwd,
    env: { ...process.env, ...(front.envKey ? { [front.envKey]: apiUrl } : {}) },
    shell: win,
    stdio: "ignore",
  });
  try {
    let warm = false;
    const deadline = Date.now() + front.warmMs;
    while (Date.now() < deadline && !warm) {
      await new Promise((r) => setTimeout(r, 700));
      try { warm = (await fetch(`http://127.0.0.1:${front.port}/`, { signal: AbortSignal.timeout(1500) })).ok; } catch { /* ещё поднимается */ }
    }
    if (!warm) { console.error(`  ✗ фронт :${front.port} не поднялся за ${front.warmMs / 1000}с`); return false; }

    const specs = [`specs/buyer.${front.name}.spec.ts`, `specs/roles.${front.name}.spec.ts`];
    const r = spawnSync("pnpm", ["--dir", "packages/e2e", "test", ...specs], {
      stdio: "inherit",
      shell: win,
      env: { ...process.env, E2E_FRONT_URL: `http://127.0.0.1:${front.port}`, E2E_API_URL: apiUrl },
    });
    return r.status === 0;
  } finally {
    dev.kill();
    killPort(front.port);
    if (front.name === "angular" && existsSync(angularConfig)) rmSync(angularConfig);
  }
}

async function runHandoff(phase, apiUrl) {
  console.log(`\n=== handoff ${phase} против ${apiUrl} ===`);
  const r = spawnSync("pnpm", ["--dir", "packages/e2e", "test", "specs/handoff.spec.ts"], {
    stdio: "inherit",
    shell: win,
    env: { ...process.env, E2E_API_URL: apiUrl, E2E_HANDOFF_PHASE: phase },
  });
  return r.status === 0;
}

// --- разбор аргументов ---
const backArg = arg("back"); // laravel | nestjs | "" (обе группы + handoff)
const pairsArg = arg("pairs");
const explicit = pairsArg
  ? pairsArg.split(",").map((s) => s.trim()).filter(Boolean)
  : null;

const results = [];

if (explicit) {
  // ручные пары: бекенды и фронты должны быть доступны; фронт поднимаем сами, бекенд ожидаем живым
  for (const pair of explicit) {
    const [frontPort, apiPort] = pair.split(":");
    const front = FRONTS.find((f) => String(f.port) === frontPort);
    if (!front) { console.error(`неизвестный фронт-порт ${frontPort}`); process.exit(1); }
    const backName = Object.entries(BACKENDS).find(([, b]) => String(b.port) === apiPort)?.[0];
    if (!backName) { console.error(`неизвестный api-порт ${apiPort}`); process.exit(1); }
    if (!(await healthy(BACKENDS[backName].health))) await upBackend(backName);
    results.push(await runPair(front, Number(apiPort), backName));
  }
} else {
  const groups = backArg ? [backArg] : ["laravel", "nestjs"];
  for (const backName of groups) {
    await upBackend(backName);
    const apiUrl = `http://127.0.0.1:${BACKENDS[backName].port}`;
    if (backName === "nestjs") await runHandoff("verify", apiUrl); // БД ещё не тронута парами
    for (const front of FRONTS) {
      results.push(await runPair(front, BACKENDS[backName].port, backName));
    }
    // create — последним шагом laravel-группы: свежие сиды + заказ; никаких reset после
    if (backName === "laravel") {
      await resetDb();
      await runHandoff("create", apiUrl);
    }
    if (!backArg) downBackend(backName); // между группами активен один бекенд (ADR-006)
  }
}

const ok = results.filter(Boolean).length;
console.log(`\n=== матрица: ${ok}/${results.length} пар зелёные ===`);
process.exit(ok === results.length && results.length > 0 ? 0 : 1);
