// Запуск conformance-набора против бекенда: CONFORMANCE_BASE_URL (по умолчанию :8000).
// Нулевой код выхода = бекенд соответствует контракту (ADR-005).
import { loadSpec } from "./spec.js";
import { scenarios, type ScenarioResult, baseUrl } from "./scenarios.js";

const spec = await loadSpec();
const operationCount = Object.values((spec as { paths: Record<string, Record<string, unknown>> }).paths)
  .reduce((acc, item) => acc + Object.keys(item).length, 0);
console.log(`Conformance против ${baseUrl()} — операций в контракте: ${operationCount}\n`);

const results: ScenarioResult[] = [];
for (const scenario of scenarios) {
  const started = Date.now();
  try {
    await scenario.run();
    results.push({ name: scenario.name, ok: true, ms: Date.now() - started });
    console.log(`  \x1b[32m✓\x1b[0m ${scenario.name} (${Date.now() - started}ms)`);
  } catch (err) {
    results.push({ name: scenario.name, ok: false, error: (err as Error).message, ms: Date.now() - started });
    console.log(`  \x1b[31m✗\x1b[0m ${scenario.name} (${Date.now() - started}ms)\n    ${String((err as Error).message).slice(0, 400)}`);
  }
}

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
console.log(`\nитог: ${passed}/${results.length} прошли, ${failed} упали`);
process.exit(failed > 0 ? 1 : 0);
