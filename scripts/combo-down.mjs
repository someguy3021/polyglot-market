// Остановка последнего комбо (или: pnpm docker:combo:down)
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { dockerRunner, dockerRun, toWslPath } from "./lib/docker.mjs";

const ROOT = join(import.meta.dirname, "..");
const runner = dockerRunner();
if (!runner) process.exit(1);
const infra = join(ROOT, "infra", "docker-compose.infra.yml");
const combo = join(ROOT, "infra", "docker-compose.combo.yml");
const base = ["compose", "-f", runner.kind === "wsl" ? toWslPath(infra) : infra, "-f", runner.kind === "wsl" ? toWslPath(combo) : combo];
dockerRun(runner, [...base, "down"]);
console.log("combo: остановлено.");
