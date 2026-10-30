"use client";

import { useEffect, useState } from "react";
import type { OrderStatus } from "@showcase/api-client";
import { api, errorMessage } from "@/shared/client-api";

interface AdminOrder {
  id: string; status: string; total: number; createdAt: string;
  items: Array<{ id: string; title: string; quantity: number }>;
}

const transitions: Record<string, string[]> = {
  new: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["done"],
  done: [],
  cancelled: [],
};
const labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await api.admin.listAllOrders(1, 50);
    setOrders(res.data.data);
  }

  async function changeStatus(id: string, status: string) {
    try {
      await api.admin.updateOrderStatus(id, { status: status as OrderStatus });
      await load();
    } catch (err) {
      setError(errorMessage(err));
      await load();
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1>Админ — заказы</h1>
      {error && <div className="error">{error}</div>}
      <table width="100%">
        <thead><tr><th align="left">Заказ</th><th align="left">Позиции</th><th align="left">Сумма</th><th align="left">Статус →</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id.slice(0, 8)}…</td>
              <td>
                {o.items.map((i) => (
                  <div key={i.id} style={{ fontSize: 13 }}>{i.title} × {i.quantity}</div>
                ))}
              </td>
              <td>${o.total.toFixed(2)}</td>
              <td>
                <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                  {[o.status, ...(transitions[o.status] ?? [])].map((s) => (
                    <option key={s} value={s}>{labels[s] ?? s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
