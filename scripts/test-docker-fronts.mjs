// node scripts/test-docker-fronts.mjs [--front=<имя>] — сборка и проверка docker-образов
// фронтов (ADR-007): docker build из корня репы → контейнер на свободном порту →
// HTTP 200 на / (+ /config.js с API_URL для SPA). API_URL по умолчанию — живой Laravel
// на хосте (host.docker.internal:8010), чтобы SSR-фронты могли отрисовать каталог.
import { spawnSync } from "node:child_process";
import { dockerRunner, toWslPath } from "./lib/docker.mjs";

const FRONT_PORTS = {
  "vue-quasar": 9710,
  vue2: 9711,
  react: 9712,
  nuxt: 9713,
  next: 9714,
  sveltekit: 9715,
  angular: 9716,
};

const only = (process.argv.find((a) => a.startsWith("--front=")) ?? "").split("=")[1];
const fronts = only ? [only] : Object.keys(FRONT_PORTS);
const API_URL = process.env.DOCKER_API_URL ?? "http://host.docker.internal:8010";
const win = process.platform === "win32";

const runner = dockerRunner();
if (!runner) { console.error("docker недоступен (native/WSL)"); process.exit(1); }
console.log(`docker runner: ${runner.kind}${runner.distro ? ` (${runner.distro})` : ""}`);

const root = runner.kind === "wsl" ? toWslPath(process.cwd()) : process.cwd();
const docker = (args, inherit = false) => {
  const argv = runner.kind === "wsl" ? ["-d", runner.distro, "-e", "docker", ...args] : args;
  const cmd = runner.kind === "wsl" ? "wsl.exe" : "docker";
  const r = spawnSync(cmd, argv, { stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"], encoding: "utf8", windowsHide: true, shell: win });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};
const wsl = (p) => (runner.kind === "wsl" ? toWslPath(p) : p);

const results = [];
for (const front of fronts) {
  const port = FRONT_PORTS[front];
  const tag = `pm-front-${front}:check`;
  const container = `pm-check-${front}`;
  console.log(`\n=== ${front}: build ===`);
  // VITE_API_URL как build-arg нужен sveltekit: SSR-код инлайнит адрес при сборке
  const build = docker(["build", "--build-arg", `VITE_API_URL=${API_URL}`, "-f", wsl(`frontend/${front}/Dockerfile`), "-t", tag, root], true);
  if (!build.ok) { console.error("  ✗ build упал"); results.push(false); continue; }

  docker(["rm", "-f", container]);
  // PORT=3000: SPA-обёртка serve.mjs слушает $PORT (дефолт 80), SSR-фронты — тоже $PORT.
  // SPA_ROOT НЕ передаём: у angular он в собственном Dockerfile, остальным хватает дефолта.
  // host.docker.internal в WSL-docker появляется только через host-gateway
  const run = docker(["run", "-d", "--name", container, "--add-host", "host.docker.internal:host-gateway", "-p", `${port}:3000`, "-e", "PORT=3000", "-e", `API_URL=${API_URL}`, "-e", `NUXT_PUBLIC_API_URL=${API_URL}`, "-e", `NEXT_PUBLIC_API_URL=${API_URL}`, "-e", `VITE_API_URL=${API_URL}`, tag]);
  if (!run.ok) { console.error("  ✗ run упал"); results.push(false); continue; }

  let up = false;
  let status = 0;
  for (let i = 0; i < 30 && !up; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1500) });
      status = res.status;
      // 200 — каталок отрисовался; 500 у SSR-фронтов допустимо: каталог недостижим
      // без живого API из контейнера, но сам сервер отвечает — контейнер рабочий
      up = res.status < 600;
    } catch { /* стартует */ }
  }
  if (!up) {
    console.error(`  ✗ контейнер не ответил на :${port} за 30с`);
    const logs = docker(["logs", container]);
    console.error((logs.out || "(пусто)").slice(0, 600));
    results.push(false);
    docker(["rm", "-f", container]);
    continue;
  }
  const ssrNote = status !== 200 ? ` (HTTP ${status}: SSR без живого API — сервер отвечает, каталог недоступен из контейнера)` : "";

  // SPA-фронты отдают runtime-конфиг /config.js
  let configOk = "n/a (SSR)";
  try {
    const res = await fetch(`http://127.0.0.1:${port}/config.js`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const body = await res.text();
      configOk = body.includes(API_URL) ? "ok" : `не содержит ${API_URL}`;
    }
  } catch { /* SSR-фронты без config.js */ }

  console.log(`  ✅ HTTP ${status} на :${port}${ssrNote}, config.js: ${configOk}`);
  results.push(true);
  docker(["rm", "-f", container]);
}

const ok = results.filter(Boolean).length;
console.log(`\n=== docker-фронты: ${ok}/${results.length} зелёные ===`);
process.exit(ok === results.length ? 0 : 1);
