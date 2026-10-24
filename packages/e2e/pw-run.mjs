// Лаунчер E2E (фича 14): перенаправляет кэш трансформации Playwright из os.tmpdir()
// (playwright-transform-cache — мусор во временной папке Windows) в репу `.cache/pw-transform`.
// Все запуски E2E обязаны идти через него: package.json «test», check:all, e2e:matrix.
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const cache = join(ROOT, ".cache", "pw-transform");
mkdirSync(cache, { recursive: true });
process.env.PWTEST_CACHE_DIR = cache;

const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve("@playwright/test/package.json")), "cli.js");
const r = spawnSync(process.execPath, [cli, "test", ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(r.status ?? 1);
