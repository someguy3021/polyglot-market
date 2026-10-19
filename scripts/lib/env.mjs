// Минимальный загрузчик .env (без внешних зависимостей).
// Переменные уже заданные в окружении имеют приоритет над файлом.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");

export function loadEnv(root = ROOT) {
  const file = join(root, ".env");
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      if (!(key in process.env)) {
        process.env[key] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
  return process.env;
}
