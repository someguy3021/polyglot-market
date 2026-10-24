import { expect, test } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { API, apiCreateBuyerOrder, apiLogin } from "./_api";

/**
 * Сквозной кейс общей БД (фича 14 R3): заказ, созданный через Laravel, виден через
 * NestJS. ADR-006 запрещает параллельные бекенды, поэтому кейс двухфазный и
 * оркестрируется раннером `pnpm e2e:matrix`:
 *   фаза create (активен Laravel)  — покупатель оформляет заказ, id — в .cache/handoff-state.json;
 *   фаза verify (активен NestJS)   — тот же заказ читается через второй бекенд.
 * Вне раннера спека пропускается.
 */
const phase = process.env.E2E_HANDOFF_PHASE ?? "";
// cwd прогона — packages/e2e (playwright-transpile не знает import.meta)
const stateFile = join(process.cwd(), "..", "..", ".cache", "handoff-state.json");

test("сквозной кейс: заказ, созданный на одном бекенде, виден через второй", async () => {
  if (phase === "create") {
    const order = await apiCreateBuyerOrder();
    writeFileSync(stateFile, JSON.stringify(order));
    console.log(`handoff: заказ ${order.id} создан через ${API}`);
    expect(order.status).toBe("new");
    return;
  }
  if (phase === "verify") {
    const { id } = JSON.parse(readFileSync(stateFile, "utf8")) as { id: string };
    const token = await apiLogin("buyer@demo.dev");
    const res = await fetch(`${API}/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status, `заказ ${id} из state-файла виден через ${API}`).toBe(200);
    const body = (await res.json()) as { data?: { id: string }; id?: string };
    expect((body.data ?? body).id).toBe(id);
    console.log(`handoff: заказ ${id} прочитан через ${API}`);
    return;
  }
  test.skip(true, "гоняется раннером e2e:matrix (E2E_HANDOFF_PHASE=create|verify)");
});
