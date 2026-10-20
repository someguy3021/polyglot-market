// Прогрев дев-сервера фронта перед E2E: первый запрос триггерит vite-компиляцию.
const url = process.argv[2] ?? "http://127.0.0.1:9000/";
const deadline = Date.now() + 60_000;
while (Date.now() - deadline < 0 || Date.now() < deadline) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (res.ok) { console.log(`warm: ${url} отвечает`); process.exit(0); }
  } catch { /* ещё компилируется */ }
  await new Promise((r) => setTimeout(r, 1000));
}
console.error(`warm: ${url} не ответил за 60с`);
process.exit(1);
