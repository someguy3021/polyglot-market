// pnpm k8s:load — нагрузочный прогон 6.2: k6 против каталога через ingress,
// HPA nestjs/laravel раскачиваются (CPU > 60%), реплики растут, трафик делится.
// Оркестрация повторяет scripts/k8s.mjs (wsl-раннер, ADR-012); k6 ставится
// тем же ensureTools-путём (~/.local/bin дистрибутива).
// Предварительно: pnpm k8s:up (кластер, ingress, HPA, metrics-server).
import { spawnSync, spawn } from "node:child_process";
import { join } from "node:path";
import { dockerRunner, toWslPath, keepWslAlive } from "./lib/docker.mjs";
import { ROOT } from "./lib/config.mjs";

const NS = "polyglot";
const K6_VERSION = process.env.K6_VERSION ?? "v0.57.0";
const LOAD_SCRIPT = join(ROOT, "infra", "k8s", "load", "catalog.js");
const BASE_URL = process.env.K8S_BASE_URL ?? "http://127.0.0.1:8080";

// Спавн внутри дистрибутива (как в k8s.mjs; продублировано — там top-level argv).
function sh(distro, script, { capture = false } = {}) {
  const r = spawnSync(
    "wsl.exe",
    ["-d", distro, "-e", "sh", "-c", `export PATH="$HOME/.local/bin:$PATH"; ${script}`],
    { stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit", windowsHide: true, encoding: "utf8" },
  );
  return { status: r.status, out: `${r.stdout ?? ""}\n${r.stderr ?? ""}`.replace(/\0/g, "").trim() };
}

function must(distro, script, what) {
  const r = sh(distro, script, { capture: true });
  if (r.status !== 0) {
    console.error(r.out);
    throw new Error(`${what} — код выхода ${r.status}`);
  }
  return r.out;
}

const k6Install = (distro) =>
  `mkdir -p "$HOME/.local/bin" && curl -fsSL "https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-linux-amd64.tar.gz" | tar -xzO "k6-${K6_VERSION}-linux-amd64/k6" > "$HOME/.local/bin/k6" && chmod +x "$HOME/.local/bin/k6"`;

async function main() {
  const runner = dockerRunner();
  if (!runner || runner.kind !== "wsl") {
    console.error("docker/WSL недоступен — см. pnpm doctor");
    process.exit(1);
  }
  const distro = runner.distro;
  keepWslAlive(distro);

  // предусловия: кластер отвечает, k6 установлен, HPA на месте
  const health = await fetch(`${BASE_URL}/api/health`).then((r) => r.json()).catch(() => null);
  if (health?.status !== "ok") {
    console.error(`кластер не отвечает (${BASE_URL}/api/health) — сначала pnpm k8s:up`);
    process.exit(1);
  }
  console.log(`k8s:load: цель ${BASE_URL} (service: ${health.service})`);
  if (sh(distro, "command -v k6 >/dev/null 2>&1", { capture: true }).status !== 0) {
    console.log(`k8s:load: ставлю k6 ${K6_VERSION}...`);
    must(distro, k6Install(distro), "скачивание k6");
  }
  must(distro, `kubectl -n ${NS} get hpa nestjs laravel`, "HPA nestjs/laravel не найдены — pnpm k8s:up");

  console.log("\n=== ДО нагрузки ===");
  console.log(must(distro, `kubectl -n ${NS} get hpa`, "get hpa"));

  // k6 фоном (обе трубы копим — иначе stderr k6 перемешивается с таймлайном),
  // параллельно сэмплируем HPA и CPU подов
  const child = spawn(
    "wsl.exe",
    ["-d", distro, "-e", "sh", "-c", `export PATH="$HOME/.local/bin:$PATH"; k6 run "${toWslPath(LOAD_SCRIPT)}"`],
    { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  let k6out = "";
  child.stdout.on("data", (d) => { k6out += d; });
  child.stderr.on("data", (d) => { k6out += d; });

  const started = Date.now();
  let lastTop = 0;
  while (child.exitCode === null) {
    await new Promise((r) => setTimeout(r, 5000));
    const t = Math.round((Date.now() - started) / 1000);
    const reps = sh(
      distro,
      `kubectl -n ${NS} get hpa -o jsonpath='{range .items[*]}{.metadata.name}={.status.currentReplicas}/{.status.desiredReplicas}{"  "}{end}'`,
      { capture: true },
    );
    console.log(`t=${String(t).padStart(3)}s  реплики: ${reps.out || "…"}`);
    if (t - lastTop >= 25) {
      lastTop = t;
      const top = sh(distro, `kubectl -n ${NS} top pods --no-headers 2>/dev/null | grep -E "nestjs|laravel"`, { capture: true });
      if (top.out) console.log(`          cpu: ${top.out.split("\n").map((l) => l.split(/\s+/).slice(0, 2).join(" ")).join(" | ")}`);
    }
  }
  const k6exit = child.exitCode;

  console.log("\n=== ПОСЛЕ нагрузки ===");
  console.log(must(distro, `kubectl -n ${NS} get hpa`, "get hpa"));
  console.log(must(distro, `kubectl -n ${NS} get pods -l "app in (nestjs, laravel)"`, "get pods"));
  console.log("\nk8s:load: сводка k6:");
  console.log(k6out.split("\n").filter((l) => l.includes("http_req_duration") || l.includes("http_req_failed") || l.includes("iterations") || l.includes("running")).join("\n"));

  if (k6exit === 99) {
    throw new Error("k6: порог http_req_failed<5% нарушен — см. сводку выше");
  }
  if (k6exit !== 0) {
    throw new Error(`k6 упал — код выхода ${k6exit}`);
  }
  console.log("\nk8s:load: готово (порог http_req_failed<5% выдержан). Повтор — pnpm k8s:load.");
}

await main();
