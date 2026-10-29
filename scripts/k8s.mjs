// pnpm k8s:up|down|status — k8s-стенд витрины (фича 18, ADR-012).
// kind-кластер «polyglot»: docker в WSL2 (win32, ADR-009) или нативно
// (linux/darwin — CI-раннеры 6.4, mac/linux-разработка).
// kind, kubectl и k6 скачиваются в ~/.local/bin при отсутствии (пин версий).
// Образы приложений собираются локально и пушатся в локальный registry —
// реестр машины ограничен (ADR-008), пуллов образов приложений нет.
// Маршруты после подъёма: http://localhost:8080 (SPA + /api → NestJS,
// /api/laravel → Laravel), 127.0.0.1:55432 (postgres), 127.0.0.1:59002 (S3),
// http://localhost:8180 (Grafana).
import { execSync, spawnSync, spawn } from "node:child_process";
import { createConnection } from "node:net";
import { existsSync, openSync, readFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { keepWslAlive, stopWslAlive } from "./lib/docker.mjs";
import { k8sRuntime, sh, must, hostPath, toolPlatform } from "./lib/k8s-runtime.mjs";
import { config, ROOT } from "./lib/config.mjs";

const CLUSTER = "polyglot";
const NS = "polyglot";
const REGISTRY = "localhost:5001";
const KIND_VERSION = process.env.KIND_VERSION ?? "v0.26.0";
const KUBECTL_VERSION = process.env.KUBECTL_VERSION ?? "v1.32.0";
const K6_VERSION = process.env.K6_VERSION ?? "v0.57.0";
const K8S_DIR = join(ROOT, "infra", "k8s");
const infraDir = join(ROOT, ".k8s");
mkdirSync(infraDir, { recursive: true });

const cmd = process.argv[2] ?? "status";
// хост-порты стенда, которые должны быть доступны как 127.0.0.1:<порт>
const FORWARDED_PORTS = [8080, 55432, 59002];

// образы стенда: локальный тег (в docker среды) → тег в локальном registry (в манифестах)
const IMAGES = [
  { local: "infra-nestjs:latest", remote: "infra-nestjs:k8s", dockerfile: "backend/nestjs/Dockerfile" },
  { local: "infra-react:latest", remote: "infra-react:k8s", dockerfile: "frontend/react/Dockerfile" },
  { local: "infra-laravel:latest", remote: "infra-laravel:k8s", dockerfile: "backend/laravel/Dockerfile" },
  { local: "pm-s3rver:local", remote: "pm-s3rver:k8s", dockerfile: "infra/k8s/s3-dev.Dockerfile" },
  { local: "postgres:17-alpine", remote: "postgres:k8s" },
  { local: "registry.k8s.io/metrics-server/metrics-server:v0.7.2", remote: "metrics-server:k8s" },
  { local: "registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.13.0", remote: "kube-state-metrics:k8s" },
  { local: "docker.io/library/traefik:v3.3", remote: "traefik:k8s" }, // флей auth.docker.io прибил кластерный пулл (session 10) — в кластер только через локальный registry
];

if (cmd === "up") {
  await up();
} else if (cmd === "down") {
  await down();
} else if (cmd === "status") {
  await status();
} else {
  console.log("использование: node scripts/k8s.mjs up|down|status");
  process.exit(1);
}

async function up() {
  const runner = k8sRuntime();
  if (!runner) {
    console.error("docker недоступен — запустите `pnpm doctor`");
    process.exit(1);
  }
  if (runner.kind === "unsupported") {
    console.error("нативный docker на Windows не поддерживается — целевая платформа WSL2 (ADR-009)");
    process.exit(1);
  }
  if (runner.kind === "wsl") keepWslAlive(runner.distro);

  ensureTools(runner);
  ensureCluster(runner);
  loadImages(runner);
  applyManifests(runner); // создаёт и namespace — секрет только после него
  applySecret(runner);
  restartDeployments(runner); // образы пересобраны под тем же тегом — поды должны перетянуть свежие
  waitRollouts(runner);
  sh(runner, "sleep 5"); // осадка: Traefik'y нужно время пересобрать эндпоинты после рестарта
  for (const port of FORWARDED_PORTS) {
    await ensureForward(runner, port);
  }
  runDb();
  await smoke();
  console.log("\nk8s: стенд готов.");
  console.log("  витрина:  http://localhost:8080  (SPA + /api → NestJS, /api/laravel → Laravel)");
  console.log("  grafana:  http://localhost:8180  (дашборд «Polyglot stand», анонимный просмотр)");
  console.log("  postgres: 127.0.0.1:55432  (миграции/сиды с хоста)");
  console.log("  S3:       127.0.0.1:59002  (s3rver, сид-картинки)");
  console.log("  статус:   pnpm k8s:status · нагрузка: pnpm k8s:load · стоп: pnpm k8s:down");
}

async function down() {
  const runner = k8sRuntime();
  for (const port of FORWARDED_PORTS) stopBridge(port);
  if (runner && runner.kind !== "unsupported") {
    sh(runner, `kind delete cluster --name ${CLUSTER} 2>/dev/null || true`);
  }
  stopWslAlive();
  console.log("k8s: кластер удалён (данные БД/S3 стенда стёрты — это демо-стенд).");
}

async function status() {
  const runner = k8sRuntime();
  if (!runner || runner.kind === "unsupported") {
    console.log("k8s: docker недоступен — стенд не поднять (см. pnpm doctor)");
    return;
  }
  const clusters = sh(runner, "kind get clusters", { capture: true }).out;
  console.log(`кластеры kind: ${clusters || "нет"}`);
  if (!clusters.split("\n").includes(CLUSTER)) return;
  console.log(sh(runner, `kubectl -n ${NS} get pods -o wide`, { capture: true }).out);
  console.log(sh(runner, `kubectl -n ${NS} get services,ingress,hpa`, { capture: true }).out);
  await Promise.all(FORWARDED_PORTS.map(async (port) => {
    const ok = await portOpen(port);
    console.log(`forward: 127.0.0.1:${port} — ${ok ? "доступен" : "НЕ доступен"}`);
  }));
  try {
    const res = await fetch("http://127.0.0.1:8080/api/health");
    console.log(`health: HTTP ${res.status} ${JSON.stringify(await res.json())}`);
  } catch {
    console.log("health: http://127.0.0.1:8080/api/health не отвечает");
  }
}

// --- Шаги up ---

function ensureTools(runner) {
  const platform = toolPlatform(runner);
  if (!platform) {
    console.error(`тулзы k8s не ставятся на ${process.platform}/${process.arch} — поставьте kind/kubectl сами`);
    process.exit(1);
  }
  if (sh(runner, "command -v kind >/dev/null 2>&1", { capture: true }).status !== 0) {
    console.log(`k8s: ставлю kind ${KIND_VERSION} в ~/.local/bin...`);
    must(runner, `mkdir -p "$HOME/.local/bin" && curl -fsSL -o "$HOME/.local/bin/kind" "https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-${platform}" && chmod +x "$HOME/.local/bin/kind"`, "скачивание kind");
  }
  if (sh(runner, "command -v kubectl >/dev/null 2>&1", { capture: true }).status !== 0) {
    console.log(`k8s: ставлю kubectl ${KUBECTL_VERSION} в ~/.local/bin...`);
    must(runner, `mkdir -p "$HOME/.local/bin" && curl -fsSL -o "$HOME/.local/bin/kubectl" "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/${platform}/kubectl" && chmod +x "$HOME/.local/bin/kubectl"`, "скачивание kubectl");
  }
  if (sh(runner, "command -v k6 >/dev/null 2>&1", { capture: true }).status !== 0) {
    console.log(`k8s: ставлю k6 ${K6_VERSION} в ~/.local/bin (нагрузочный прогон 6.2)...`);
    must(
      runner,
      `mkdir -p "$HOME/.local/bin" && curl -fsSL "https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-${platform}.tar.gz" | tar -xzO "k6-${K6_VERSION}-${platform}/k6" > "$HOME/.local/bin/k6" && chmod +x "$HOME/.local/bin/k6"`,
      "скачивание k6",
    );
  }
  console.log(`k8s: ${must(runner, "kind version", "kind version").split("\n")[0]}, kubectl ${(must(runner, "kubectl version --client=true", "kubectl version").match(/v[\d.]+/) ?? ["?"])[0]}`);
}

function ensureCluster(runner) {
  const clusters = must(runner, "kind get clusters", "kind get clusters");
  if (clusters.split("\n").includes(CLUSTER)) {
    console.log(`k8s: кластер ${CLUSTER} уже существует.`);
    return;
  }
  console.log(`k8s: создаю кластер ${CLUSTER} (первый раз качается kindest/node ~1 ГБ — это долго)...`);
  must(runner, `kind create cluster --config "${hostPath(runner, join(K8S_DIR, "kind-config.yaml"))}" --wait 300s`, "kind create cluster", { stdio: "inherit" });
}

function loadImages(runner) {
  ensureRegistry(runner);
  // Сборка всегда (кэш слоёв делает её дешёвой после первой), чтобы стенд подхватил свежий код.
  for (const img of IMAGES) {
    if (!img.dockerfile) continue;
    console.log(`k8s: собираю ${img.local}...`);
    must(runner, `docker build -f "${hostPath(runner, join(ROOT, img.dockerfile))}" -t "${img.local}" "${hostPath(runner, ROOT)}"`, `docker build ${img.local}`, { stdio: "inherit" });
  }
  // образы без Dockerfile — готовые с реестров: докачать, если локально нет
  for (const img of IMAGES.filter((i) => !i.dockerfile)) {
    if (sh(runner, `docker image inspect ${img.local}`, { capture: true }).status !== 0) {
      must(runner, `docker pull ${img.local}`, `docker pull ${img.local}`);
    }
  }
  console.log(`k8s: пушу образы в локальный registry (${REGISTRY})...`);
  for (const img of IMAGES) {
    must(runner, `docker tag ${img.local} ${REGISTRY}/${img.remote} && docker push -q ${REGISTRY}/${img.remote}`, `push ${REGISTRY}/${img.remote}`);
  }
}

function ensureRegistry(runner) {
  // kind load не работает с docker 29 + containerd image store (ctr: content digest
  // not found, session 10) — канонический рецепт kind: локальный registry в сети kind.
  if (sh(runner, "docker inspect kind-registry", { capture: true }).status !== 0) {
    console.log("k8s: поднимаю локальный registry (контейнер kind-registry, localhost:5001)...");
    must(runner, "docker run -d --restart=always -p 127.0.0.1:5001:5000 --name kind-registry registry:2", "docker run registry:2", { stdio: "inherit" });
  }
  // ноды кластера тянут образы по имени kind-registry — контейнер должен быть в сети kind
  sh(runner, "docker network connect kind kind-registry 2>/dev/null || true", { capture: true });
}

function applySecret(runner) {
  // Секреты — из локального .env (принцип AGENTS.md); apply идемпотентен.
  const q = (s) => `'${String(s).replaceAll("'", `'\\''`)}'`;
  must(
    runner,
    `kubectl -n ${NS} create secret generic polyglot-secrets` +
      ` --from-literal=db-password=${q(config.db.password)}` +
      ` --from-literal=jwt-secret=${q(config.jwtSecret)}` +
      ` --from-literal=s3-access-key=${q(config.s3.accessKey)}` +
      ` --from-literal=s3-secret-key=${q(config.s3.secretKey)}` +
      ` --dry-run=client -o yaml | kubectl apply -f -`,
    "создание секрета polyglot-secrets",
  );
  console.log("k8s: секрет polyglot-secrets применён (из локального .env).");
}

function applyManifests(runner) {
  console.log("k8s: применяю манифесты (CRD → third-party → base → observability)...");
  must(runner, `kubectl apply -f "${hostPath(runner, join(K8S_DIR, "crds"))}"`, "apply CRD");
  // CRD нужно время, чтобы зарегистрироваться в API до Middleware из base.
  sh(runner, "sleep 3", { capture: true });
  must(runner, `kubectl apply -f "${hostPath(runner, join(K8S_DIR, "third-party"))}"`, "apply third-party (metrics-server)");
  must(runner, `kubectl apply -k "${hostPath(runner, join(K8S_DIR, "base"))}"`, "apply base");
  must(runner, `kubectl apply -k "${hostPath(runner, join(K8S_DIR, "observability"))}"`, "apply observability");
}

function restartDeployments(runner) {
  // imagePullPolicy: Always делает рестарт достаточным: поды перекачают пересобранные
  // образы из локального registry. Без этого up на живом кластере молча держал бы старый код.
  sh(runner, `kubectl -n ${NS} rollout restart deploy --all`, { capture: true });
  sh(runner, "sleep 2", { capture: true });
}

function waitRollouts(runner) {
  console.log("k8s: жду rollout'ы деплойментов...");
  const r = sh(runner, `kubectl -n ${NS} wait --for=condition=available deployment --all --timeout=300s`, { capture: true });
  console.log(r.out);
  if (r.status !== 0) {
    console.error(sh(runner, `kubectl -n ${NS} get pods`, { capture: true }).out);
    throw new Error("rollout не завершился за 300с — см. статусы подов выше");
  }
}

function runDb() {
  // Миграции и сиды — штатным раннером с хоста, против кластерной БД и S3 (ADR-002).
  // Раннер всегда на стороне Node-процесса (win32/linux/darwin), поэтому без обёртки sh.
  const env = {
    ...process.env,
    DB_HOST: "127.0.0.1",
    DB_PORT: "55432",
    S3_ENDPOINT: "http://127.0.0.1:59002",
  };
  console.log("k8s: миграции (scripts/db.mjs migrate против кластерной БД)...");
  const m = spawnSync(process.execPath, [join(ROOT, "scripts", "db.mjs"), "migrate"], { stdio: "inherit", env, windowsHide: true });
  if (m.status !== 0) throw new Error("миграции против кластерной БД упали");
  console.log("k8s: сиды (db:seed)...");
  const s = spawnSync(process.execPath, [join(ROOT, "scripts", "db.mjs"), "seed"], { stdio: "inherit", env, windowsHide: true });
  if (s.status !== 0) throw new Error("сиды против кластерной БД/S3 упали");
}

async function smoke() {
  const checks = [
    ["API через ingress (срез /api)", "http://127.0.0.1:8080/api/health", (b) => b.status === "ok" && b.service === "nestjs"],
    ["laravel через ingress (ADR-006)", "http://127.0.0.1:8080/api/laravel/health", (b) => b.status === "ok" && b.service === "laravel"],
    ["каталог через ingress", "http://127.0.0.1:8080/api/products", (b) => Array.isArray(b?.data) && b.data.length > 0],
    ["SPA через ingress", "http://127.0.0.1:8080/", (b) => b.includes("<div id=")],
  ];
  for (const [name, url, ok] of checks) {
    const res = await fetch(url);
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    if (res.status !== 200 || !ok(body)) {
      throw new Error(`smoke "${name}" не прошёл: HTTP ${res.status} с ${url}`);
    }
    console.log(`k8s: smoke ok — ${name} (HTTP ${res.status})`);
  }
}

// --- Проброс портов WSL → Windows (мост при сломанном localhost-forwarding, как в infra.mjs) ---

async function ensureForward(runner, port) {
  if (await portOpen(port)) {
    console.log(`forward: 127.0.0.1:${port} — нативный forwarding работает.`);
    return;
  }
  if (runner.kind !== "wsl") throw new Error(`порт ${port} недоступен на хосте`);
  const distro = runner.distro;
  const ip = sh({ kind: "wsl", distro }, "hostname -I", { capture: true }).out.split(/\s+/)[0] ?? "";
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
      console.log(`forward: 127.0.0.1:${port} — поднят мост на WSL IP ${ip} (forwarding WSL не работает).`);
      return;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`мост для порта ${port} не поднялся (см. .k8s/bridge-${port}.log)`);
}

function portOpen(port) {
  return new Promise((resolveProbe) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => { socket.destroy(); resolveProbe(true); });
    socket.once("error", () => resolveProbe(false));
    socket.setTimeout(1500, () => { socket.destroy(); resolveProbe(false); });
  });
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
