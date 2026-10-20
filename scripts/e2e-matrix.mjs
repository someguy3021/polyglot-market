// pnpm e2e:matrix — раннер пар фронт × бекенд (фича 14).
// Для каждой пары: db:reset → quasar dev с VITE_API_URL бекенда → спеки buyer + roles.
// Бекенды должны быть запущены заранее (laravel :8010, nest :3000 — контейнер или нативно).
import { spawn, spawnSync } from "node:child_process";

const pairs = (process.argv.find((a) => a.startsWith("--pairs=")) ?? "")
  .split("=")
  .slice(1)
  .join("=")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const only = pairs.length
  ? pairs
  : ["9000:8010", "9000:3000", "3001:8010", "3001:3000"]; // фронт-порт : API-порт

const killPort = (port) => {
  try {
    if (process.platform === "win32") {
      const pid = execSync(`netstat -ano | findstr ":${port} .*LISTENING"`, { shell: true, encoding: "utf8" })
        .split("\n")[0]?.trim().split(/\s+/).pop();
      if (pid) execSync(`taskkill /PID ${pid} /F`, { shell: true, stdio: "ignore" });
    }
  } catch { /* не слушался */ }
};

const results = [];

for (const pair of only) {
  const [frontPort, apiPort] = pair.split(":");
  const backName = apiPort === "3000" ? "nestjs" : "laravel";
  const frontName = frontPort === "9000" ? "quasar" : frontPort === "3001" ? "react" : frontPort;
  console.log(`\n=== пара ${frontName}(:${frontPort}) × ${backName}(:${apiPort}) ===`);

  // чистые сиды
  spawnSync("node", ["scripts/db.mjs", "reset"], { stdio: "inherit", shell: process.platform === "win32" });

  // перезапуск quasar с VITE_API_URL бекенда
  killPort(frontPort);
  const vite = spawn("npx", ["vite", "--port", frontPort], {
    cwd: "frontend/vue-quasar",
    env: { ...process.env, VITE_API_URL: `http://127.0.0.1:${apiPort}` },
    shell: process.platform === "win32",
    stdio: "ignore",
  });
  let warm = false;
  for (let i = 0; i < 20 && !warm; i++) {
    await new Promise((r) => setTimeout(r, 700));
    try {
      const res = await fetch(`http://127.0.0.1:${frontPort}/`);
      warm = res.ok;
    } catch { /* ещё поднимается */ }
  }
  if (!warm) { console.error(`  ✗ фронт :${frontPort} не поднялся`); results.push(false); continue; }

  // покупательский путь своим файлом спеков (селекторы фреймворк-специфичны);
  // роль-сценарии — отдельным opt-in запуском specs/roles.quasar.spec.ts
  const spec = frontPort === "9000" ? "buyer.quasar.spec.ts" : "buyer.react.spec.ts";
  const r = spawnSync("npx", ["playwright", "test", ...spec.split(" ")], {
    cwd: "packages/e2e",
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, E2E_FRONT_URL: `http://127.0.0.1:${frontPort}`, E2E_API_URL: `http://127.0.0.1:${apiPort}` },
  });
  results.push(r.status === 0);
  vite.kill();
}

const ok = results.filter(Boolean).length;
console.log(`\n=== матрица: ${ok}/${results.length} пар зелёные ===`);
process.exit(ok === results.length && results.length > 0 ? 0 : 1);
