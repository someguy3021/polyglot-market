// node scripts/test-extracts.mjs — матричный тест фабрики (фича 16, этап 5.2):
// для всех 14 комбинаций «фронт × бекенд» создаётся экстракт (с --ci, git init,
// lockfile) и проверяется состав: самостоятельный package.json/README/workspace,
// lockfile, CI-workflow, git-история с честным initial commit.
// Экстракты живут в .cache/extract-matrix (вне git) и удаляются перед прогоном.
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const FRONTS = ["vue-quasar", "vue2", "react", "angular", "nuxt", "next", "sveltekit"];
const BACKS = ["laravel", "nestjs"];
const OUT_DIR = join(process.cwd(), ".cache", "extract-matrix");
const win = process.platform === "win32";

rmSync(OUT_DIR, { recursive: true, force: true });

const results = [];
for (const front of FRONTS) {
  for (const back of BACKS) {
    const name = `${front}-${back}`;
    const out = join(OUT_DIR, name);
    console.log(`\n=== экстракт ${name} ===`);
    const r = spawnSync("pnpm", ["extract", `--front=${front}`, `--back=${back}`, `--out=${out}`, "--ci"], {
      stdio: ["ignore", "inherit", "inherit"],
      shell: win,
    });
    if (r.status !== 0) { console.error(`  ✗ extract упал`); results.push(false); continue; }

    // состав самостоятельного проекта
    const checks = [
      ["package.json", () => {
        const pkg = JSON.parse(readFileSync(join(out, "package.json"), "utf8"));
        return pkg.name === `${name}-demo` && pkg.scripts?.doctor && pkg.scripts?.setup && pkg.scripts?.start;
      }],
      ["pnpm-workspace.yaml", () => {
        const ws = readFileSync(join(out, "pnpm-workspace.yaml"), "utf8");
        return ws.includes(`frontend/${front}`) && ws.includes(`backend/${back}`);
      }],
      ["README.md под стек", () => {
        const readme = readFileSync(join(out, "README.md"), "utf8");
        return readme.includes(`# ${front} + ${back}`) && readme.includes("pnpm setup");
      }],
      [".env.example", () => existsSync(join(out, ".env.example"))],
      ["LICENSE", () => existsSync(join(out, "LICENSE"))],
      ["CI-workflow (--ci)", () => existsSync(join(out, ".github", "workflows", "ci.yml"))],
      ["lockfile", () => existsSync(join(out, "pnpm-lock.yaml"))],
      ["frontend+backend+контракт", () =>
        existsSync(join(out, "frontend", front)) &&
        existsSync(join(out, "backend", back)) &&
        existsSync(join(out, "shared", "api-spec", "openapi.yaml"))],
      ["git init + initial commit", () => {
        const log = execSync("git log --oneline", { cwd: out, encoding: "utf8" });
        return /initial commit/.test(log) && log.trim().split("\n").length === 1;
      }],
    ];
    const failed = checks.filter(([, check]) => { try { return !check(); } catch { return true; } });
    if (failed.length) {
      console.error(`  ✗ не прошло: ${failed.map(([n]) => n).join(", ")}`);
      results.push(false);
    } else {
      console.log(`  ✅ ${checks.length}/${checks.length} проверок состава`);
      results.push(true);
    }
  }
}

const ok = results.filter(Boolean).length;
console.log(`\n=== фабрика: ${ok}/${results.length} экстрактов зелёные ===`);
process.exit(ok === results.length ? 0 : 1);
