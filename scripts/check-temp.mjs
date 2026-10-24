// node scripts/check-temp.mjs [--clean]
// Проверка: тесты и скрипты проекта не оставляют мусор во временной папке ОС (Windows %TEMP%).
// Сканирует os.tmpdir() по известным паттернам следов проекта; --clean удаляет найденное.
// Чужой мусор (chrome scoped_dir, другие проекты) не трогаем — только узкий список своих паттернов.
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const clean = process.argv.includes("--clean");

const patterns = [
  { re: /^playwright-transform-cache(-\d+)?$/, why: "кэш трансформации Playwright (дефолт; теперь перенаправлен в .cache/pw-transform)" },
  { re: /^pw-/, why: "временные каталоги Playwright" },
  { re: /-demo$/, why: "экстракт фабрики (pnpm extract без --out)" },
  { re: /^polyglot-/, why: "артефакты с префиксом проекта" },
];

const hits = [];
for (const e of readdirSync(tmpdir(), { withFileTypes: true })) {
  if (!e.isDirectory()) continue;
  const hit = patterns.find((p) => p.re.test(e.name));
  if (hit) hits.push({ name: e.name, why: hit.why, path: join(tmpdir(), e.name) });
}

if (hits.length === 0) {
  console.log(`check-temp: ${tmpdir()} — чисто, следов проекта нет`);
  process.exit(0);
}

for (const h of hits) console.log(`  мусор: ${h.path} — ${h.why}`);
if (clean) {
  for (const h of hits) rmSync(h.path, { recursive: true, force: true });
  console.log(`check-temp: удалено ${hits.length}`);
  process.exit(0);
}
console.log(`check-temp: найдено ${hits.length} — запусти 'node scripts/check-temp.mjs --clean'`);
process.exit(1);
