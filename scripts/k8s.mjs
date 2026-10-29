// pnpm k8s:up|down|status — k8s-стенд витрины (фича 18, ADR-012).
// kind-кластер «polyglot» в том же WSL2-docker, что и вся инфра (ADR-009).
// kind и kubectl скачиваются в ~/.local/bin дистрибутива при отсутствии (пин версий).
// Образы приложений собираются локально и загружаются в кластер kind load —
// реестр машины ограничен (ADR-008), пуллов образов приложений нет.
// Маршруты после подъёма: http://localhost:8080 (SPA + /api → NestJS),
// 127.0.0.1:55432 (postgres, миграции/сиды с хоста), 127.0.0.1:59002 (S3).
import { spawnSync, spawn, execSync } from "node:child_process";
import { createConnection } from "node:net";
import { existsSync, openSync, readFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { dockerRunner, toWslPath, keepWslAlive, stopWslAlive } from "./lib/docker.mjs";
import { config, ROOT } from "./lib/config.mjs";

const CLUSTER = "polyglot";
const NS = "polyglot";
const REGISTRY = "localhost:5001";
const KIND_VERSION = process.env.KIND_VERSION ?? "v0.26.0";
const KUBECTL_VERSION = process.env.KUBECTL_VERSION ?? "v1.32.0";
const K8S_DIR = join(ROOT, "infra", "k8s");
const infraDir = join(ROOT, ".k8s");
mkdirSync(infraDir, { recursive: true });

const cmd = process.argv[2] ?? "status";
// хост-порты стенда, которые должны быть доступны с Windows как 127.0.0.1:<порт>
const FORWARDED_PORTS = [8080, 55432, 59002];

// образы стенда: локальный тег (в docker WSL) → тег в локальном registry (в манифестах)
const IMAGES = [
  { local: "infra-nestjs:latest", remote: "infra-nestjs:k8s", dockerfile: "backend/nestjs/Dockerfile" },
  { local: "infra-react:latest", remote: "infra-react:k8s", dockerfile: "frontend/react/Dockerfile" },
  { local: "pm-s3rver:local", remote: "pm-s3rver:k8s", dockerfile: "infra/k8s/s3-dev.Dockerfile" },
  { local: "postgres:17-alpine", remote: "postgres:k8s" },
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

// --- Обёртки над WSL (kind/kubectl живут внутри дистрибутива, ~/.local/bin) ---

function sh(distro, script, { stdio = "inherit", capture = false } = {}) {
  const r = spawnSync(
    "wsl.exe",
    ["-d", distro, "-e", "sh", "-c", `export PATH="$HOME/.local/bin:$PATH"; ${script}`],
    { stdio: capture ? ["ignore", "pipe", "pipe"] : stdio, windowsHide: true, encoding: "utf8" },
  );
  return { status: r.status, out: `${r.stdout ?? ""}\n${r.stderr ?? ""}`.replace(/\0/g, "").trim() };
}

function must(distro, script, what, { stdio } = {}) {
  const r = sh(distro, script, { capture: !stdio, stdio });
  if (r.status !== 0) {
    console.error(r.out);
    throw new Error(`${what} — код выхода ${r.status}`);
  }
  return r.out;
}

async function up() {
  const runner = dockerRunner();
  if (!runner) {
    console.error("docker недоступен — запустите `pnpm doctor`");
    process.exit(1);
  }
  if (runner.kind !== "wsl") {
    console.error("нативный docker: поставьте kind и kubectl сами (целевая платформа — WSL2, ADR-009)");
    process.exit(1);
  }
  const distro = runner.distro;
  keepWslAlive(distro);

  console.log(`k8s: дистрибутив ${distro}, docker ${dockerVersion(runner)} — ok`);
  ensureTools(distro);
  ensureCluster(distro);
  loadImages(distro);
  applyManifests(distro); // создаёт и namespace — секрет только после него
  applySecret(distro);
  waitRollouts(distro);
  for (const port of FORWARDED_PORTS) {
    await ensureForward(port);
  }
  runDb();
  await smoke();
  console.log("\nk8s: стенд готов.");
  console.log("  витрина:  http://localhost:8080  (SPA + /api → NestJS через Traefik)");
  console.log("  postgres: 127.0.0.1:55432  (миграции/сиды с хоста)");
  console.log("  S3:       127.0.0.1:59002  (s3rver, сид-картинки)");
  console.log("  статус:   pnpm k8s:status · стоп: pnpm k8s:down");
}

async function down() {
  const runner = dockerRunner();
  for (const port of FORWARDED_PORTS) stopBridge(port);
  if (runner?.kind === "wsl") {
    sh(runner.distro, `kind delete cluster --name ${CLUSTER} 2>/dev/null || true`);
  } else if (runner) {
    spawnSync("kind", ["delete", "cluster", "--name", CLUSTER], { stdio: "inherit", windowsHide: true });
  }
  stopWslAlive();
  console.log("k8s: кластер удалён (данные БД/S3 стенда стёрты — это демо-стенд).");
}

async function status() {
  const runner = dockerRunner();
  if (!runner || runner.kind !== "wsl") {
    console.log("k8s: docker/WSL недоступны — стенд не поднять (см. pnpm doctor)");
    return;
  }
  const clusters = sh(runner.distro, "kind get clusters", { capture: true }).out;
  console.log(`кластеры kind: ${clusters || "нет"}`);
  if (!clusters.split("\n").includes(CLUSTER)) return;
  console.log(sh(runner.distro, `kubectl -n ${NS} get pods -o wide`, { capture: true }).out);
  console.log(sh(runner.distro, `kubectl -n ${NS} get services,ingress`, { capture: true }).out);
  await Promise.all(FORWARDED_PORTS.map(async (port) => {
    const ok = await portOpen(port);
    console.log(`forward: 127.0.0.1:${port} — ${ok ? "доступен" : "НЕ доступен"}`);
  }));
  try {
    const res = await fetch("http://127.0.0.1:8080/health");
    console.log(`health: HTTP ${res.status} ${JSON.stringify(await res.json())}`);
  } catch {
    console.log("health: http://127.0.0.1:8080/health не отвечает");
  }
}

// --- Шаги up ---

function dockerVersion(runner) {
  try {
    const r = spawnSync(
      runner.kind === "wsl" ? "wsl.exe" : "docker",
      runner.kind === "wsl" ? ["-d", runner.distro, "-e", "docker", "version", "--format", "{{.Server.Version}}"] : ["version", "--format", "{{.Server.Version}}"],
      { encoding: "utf8", windowsHide: true },
    );
    return `${r.stdout}`.replace(/\0/g, "").trim() || "?";
  } catch {
    return "?";
  }
}

function ensureTools(distro) {
  if (sh(distro, "command -v kind >/dev/null 2>&1", { capture: true }).status !== 0) {
    console.log(`k8s: ставлю kind ${KIND_VERSION} в ~/.local/bin дистрибутива...`);
    must(distro, `mkdir -p "$HOME/.local/bin" && curl -fsSL -o "$HOME/.local/bin/kind" "https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-linux-amd64" && chmod +x "$HOME/.local/bin/kind"`, "скачивание kind");
  }
  if (sh(distro, "command -v kubectl >/dev/null 2>&1", { capture: true }).status !== 0) {
    console.log(`k8s: ставлю kubectl ${KUBECTL_VERSION} в ~/.local/bin дистрибутива...`);
    must(distro, `mkdir -p "$HOME/.local/bin" && curl -fsSL -o "$HOME/.local/bin/kubectl" "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && chmod +x "$HOME/.local/bin/kubectl"`, "скачивание kubectl");
  }
  console.log(`k8s: ${must(distro, "kind version", "kind version").split("\n")[0]}, kubectl ${(must(distro, "kubectl version --client=true", "kubectl version").match(/v[\d.]+/) ?? ["?"])[0]}`);
}

function ensureCluster(distro) {
  const clusters = must(distro, "kind get clusters", "kind get clusters");
  if (clusters.split("\n").includes(CLUSTER)) {
    console.log(`k8s: кластер ${CLUSTER} уже существует.`);
    return;
  }
  console.log(`k8s: создаю кластер ${CLUSTER} (первый раз качается kindest/node ~1 ГБ — это долго)...`);
  must(distro, `kind create cluster --config "${toWslPath(join(K8S_DIR, "kind-config.yaml"))}" --wait 300s`, "kind create cluster", { stdio: "inherit" });
}

function loadImages(distro) {
  ensureRegistry(distro);
  // Сборка всегда (кэш слоёв делает её дешёвой после первой), чтобы стенд подхватил свежий код.
  for (const img of IMAGES) {
    if (!img.dockerfile) continue;
    console.log(`k8s: собираю ${img.local}...`);
    must(distro, `docker build -f "${toWslPath(join(ROOT, img.dockerfile))}" -t "${img.local}" "${toWslPath(ROOT)}"`, `docker build ${img.local}`, { stdio: "inherit" });
  }
  const postgres = IMAGES.find((i) => i.local === "postgres:17-alpine");
  if (sh(distro, `docker image inspect ${postgres.local}`, { capture: true }).status !== 0) {
    must(distro, `docker pull ${postgres.local}`, "docker pull postgres");
  }
  console.log(`k8s: пушу образы в локальный registry (${REGISTRY})...`);
  for (const img of IMAGES) {
    must(distro, `docker tag ${img.local} ${REGISTRY}/${img.remote} && docker push -q ${REGISTRY}/${img.remote}`, `push ${REGISTRY}/${img.remote}`);
  }
}

function ensureRegistry(distro) {
  // kind load не работает с docker 29 + containerd image store (ctr: content digest
  // not found, session 10) — канонический рецепт kind: локальный registry в сети kind.
  if (sh(distro, "docker inspect kind-registry", { capture: true }).status !== 0) {
    console.log("k8s: поднимаю локальный registry (контейнер kind-registry, localhost:5001)...");
    must(distro, "docker run -d --restart=always -p 127.0.0.1:5001:5000 --name kind-registry registry:2", "docker run registry:2", { stdio: "inherit" });
  }
  // ноды кластера тянут образы по имени kind-registry — контейнер должен быть в сети kind
  sh(distro, "docker network connect kind kind-registry 2>/dev/null || true", { capture: true });
}

function applySecret(distro) {
  // Секреты — из локального .env (принцип AGENTS.md); apply идемпотентен.
  const q = (s) => `'${String(s).replaceAll("'", `'\\''`)}'`;
  must(
    distro,
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

function applyManifests(distro) {
  console.log("k8s: применяю манифесты (CRD → kustomize)...");
  must(distro, `kubectl apply -f "${toWslPath(join(K8S_DIR, "crds"))}"`, "apply CRD");
  // CRD нужно время, чтобы зарегистрироваться в API до Middleware из base.
  sh(distro, "sleep 3", { capture: true });
  must(distro, `kubectl apply -k "${toWslPath(join(K8S_DIR, "base"))}"`, "apply base");
}

function waitRollouts(distro) {
  console.log("k8s: жду rollout'ы деплойментов...");
  const r = sh(distro, `kubectl -n ${NS} wait --for=condition=available deployment --all --timeout=300s`, { capture: true });
  console.log(r.out);
  if (r.status !== 0) {
    console.error(sh(distro, `kubectl -n ${NS} get pods`, { capture: true }).out);
    throw new Error("rollout не завершился за 300с — см. статусы подов выше");
  }
}

function runDb() {
  // Миграции и сиды — штатным раннером с хоста, против кластерной БД и S3 (ADR-002).
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
    ["API через ingress (срез /api)", "http://127.0.0.1:8080/api/health", (b) => b.status === "ok"],
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

async function ensureForward(port) {
  if (await portOpen(port)) {
    console.log(`forward: 127.0.0.1:${port} — нативный WSL-forwarding работает.`);
    return;
  }
  const runner = dockerRunner();
  const distro = runner?.distro ?? "";
  if (!distro) throw new Error(`порт ${port} недоступен на Windows`);
  const ip = (spawnSync("wsl.exe", ["-d", distro, "-e", "hostname", "-I"], { encoding: "utf8", windowsHide: true }).stdout ?? "")
    .replace(/\0/g, "")
    .split(/\s+/)[0] ?? "";
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
