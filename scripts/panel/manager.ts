// Менеджер процессов + веб-панель (фича 06): spawn, логи с уровнями, автоподбор
// портов, инвариант «один активный бекенд» (ADR-006), status/start/stop/stop-all.
import { createServer } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, type WriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { join, resolve } from "node:path";
import { createServer as createNetServer } from "node:net";
import { APPS, MANAGER_PORT, TAIL_LINES, type AppSpec } from "./apps.js";

const ROOT = resolve(import.meta.dirname, "..", "..");
const LOG_DIR = join(ROOT, ".infra", "logs");
mkdirSync(LOG_DIR, { recursive: true });

interface RunningApp {
  proc: ChildProcess;
  port: number;
  logFile: WriteStream;
  tail: string[]; // последние N строк с уровнем
  startedAt: number;
}

const running = new Map<string, RunningApp>();

function isFree(port: number): Promise<boolean> {
  return new Promise((resolveProbe) => {
    const probe = createNetServer();
    probe.once("error", () => resolveProbe(false));
    probe.once("listening", () => probe.close(() => resolveProbe(true)));
    probe.listen(port, "127.0.0.1");
  });
}

async function pickPort(preferred: number): Promise<number> {
  let port = preferred;
  while (!(await isFree(port))) {
    port += 1;
    if (port > preferred + 50) throw new Error(`нет свободного порта рядом с ${preferred}`);
  }
  return port;
}

function levelOf(line: string): "error" | "warn" | "info" {
  if (/\b(error|fatal|exception|failed)\b/i.test(line)) return "error";
  if (/\b(warn|warning|deprecated)\b/i.test(line)) return "warn";
  return "info";
}

function startApp(spec: AppSpec): Promise<{ port: number }> {
  const existing = running.get(spec.key);
  if (existing) return Promise.resolve({ port: existing.port });
  if (!spec.present) throw new Error(`${spec.title}: кода ещё нет в репе (согласно roadmap)`);

  // Инвариант ADR-006: максимум один активный бекенд
  if (spec.kind === "backend") {
    for (const [key, other] of running) {
      if (APPS.find((a) => a.key === key)?.kind === "backend") {
        stopApp(key);
        console.log(`manager: ${key} остановлен — активен только один бекенд`);
      }
    }
  }

  return new Promise((resolveStart, rejectStart) => {
    pickPort(spec.defaultPort)
      .then((port) => {
        mkdirSync(LOG_DIR, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const logFile = createWriteStream(join(LOG_DIR, `${spec.key}-${stamp}.log`), { flags: "a" });
        const tail: string[] = [];

        const shellCommand = spec.command.replace("{port}", String(port));
        const proc = spawn(shellCommand, {
          cwd: join(ROOT, spec.cwd),
          shell: true,
          env: {
            ...process.env,
            PORT: String(port),
            CONFORMANCE_BASE_URL: `http://127.0.0.1:${port}`,
          },
        });

        const ingest = (src: NodeJS.ReadableStream) => {
          createInterface({ input: src }).on("line", (line) => {
            const record = `[${new Date().toISOString().slice(11, 19)}] ${line}`;
            tail.push(record);
            if (tail.length > TAIL_LINES) tail.shift();
            logFile.write(record + "\n");
          });
        };
        ingest(proc.stdout!);
        ingest(proc.stderr!);
        proc.on("exit", (code) => {
          logFile.write(`[exit] процесс завершён, код ${code}\n`);
          running.delete(spec.key);
        });

        running.set(spec.key, { proc, port, logFile, tail, startedAt: Date.now() });
        resolveStart({ port });
      })
      .catch(rejectStart);
  });
}

function stopApp(key: string): boolean {
  const app = running.get(key);
  if (!app) return false;
  running.delete(key);
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(app.proc.pid), "/T", "/F"], { shell: true });
  } else {
    app.proc.kill("SIGTERM");
  }
  return true;
}

function stopAll(): number {
  const count = running.size;
  for (const key of [...running.keys()]) stopApp(key);
  return count;
}

async function healthOf(spec: AppSpec): Promise<"up" | "down"> {
  const app = running.get(spec.key);
  if (!app || !spec.healthPath) return "down";
  try {
    const res = await fetch(`http://127.0.0.1:${app.port}${spec.healthPath}`, { signal: AbortSignal.timeout(1500) });
    return res.status < 500 ? "up" : "down";
  } catch {
    return "down";
  }
}

async function statusPayload() {
  const apps = await Promise.all(
    APPS.map(async (spec) => {
      const app = running.get(spec.key);
      return {
        key: spec.key,
        title: spec.title,
        kind: spec.kind,
        present: spec.present,
        running: Boolean(app),
        health: await healthOf(spec),
        port: app?.port ?? spec.defaultPort,
        url: app ? `http://127.0.0.1:${app.port}` : null,
        startedAt: app?.startedAt ?? null,
        logs: app?.tail.slice(-TAIL_LINES) ?? [],
      };
    }),
  );
  return {
    apps,
    setupDone: existsSync(join(ROOT, ".env")) && existsSync(join(ROOT, "database.sqlite")),
    now: new Date().toISOString(),
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${MANAGER_PORT}`);

  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(readFileSync(join(ROOT, "panel", "index.html")));
    return;
  }
  if (url.pathname === "/app.js") {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
    res.end(readFileSync(join(ROOT, "panel", "app.js")));
    return;
  }
  if (url.pathname === "/style.css") {
    res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
    res.end(readFileSync(join(ROOT, "panel", "style.css")));
    return;
  }

  try {
    if (url.pathname === "/api/status" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(await statusPayload()));
    } else if (url.pathname === "/api/start" && req.method === "POST") {
      const key = (await readBody(req)).key;
      const spec = APPS.find((a) => a.key === key);
      if (!spec) throw new Error(`неизвестное приложение: ${key}`);
      const { port } = await startApp(spec);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, port }));
    } else if (url.pathname === "/api/stop" && req.method === "POST") {
      const key = (await readBody(req)).key;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: stopApp(key) }));
    } else if (url.pathname === "/api/stop-all" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, stopped: stopAll() }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: 404, error: "not_found", message: "No such route." }));
    }
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: 400, error: "bad_request", message: (err as Error).message }));
  }
});

function readBody(req: import("node:http").IncomingMessage): Promise<{ key?: string }> {
  return new Promise((resolveBody) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolveBody(JSON.parse(raw || "{}"));
      } catch {
        resolveBody({});
      }
    });
  });
}

server.listen(MANAGER_PORT, "127.0.0.1", () => {
  console.log(`panel: http://127.0.0.1:${MANAGER_PORT} (менеджер процессов, фича 06)`);
});
