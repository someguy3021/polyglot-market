"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/client-api";

interface OrderView {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  shippingMethod: { name: string };
  items: Array<{ id: string; title: string; quantity: number; price: number }>;
}

const labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };
const colors: Record<string, string> = { new: "#1565c0", paid: "#b26a00", shipped: "#6a1b9a", done: "#2e7d32", cancelled: "#c62828" };

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.orders.listMyOrders(1, 20).then((r) => {
      setOrders(r.data.data);
      setLoaded(true);
    });
  }, []);

  return (
    <div>
      <h1>Мои заказы</h1>
      {orders.map((o) => (
        <div key={o.id} className="row" style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div>
              Заказ #{o.id.slice(0, 8)}…{" "}
              <span style={{ background: colors[o.status] ?? "#999", color: "#fff", borderRadius: 12, padding: "2px 10px", fontSize: 12 }}>
                {labels[o.status] ?? o.status}
              </span>
            </div>
            <div style={{ color: "#777", fontSize: 12 }}>{new Date(o.createdAt).toLocaleString("ru")} · {o.shippingMethod.name}</div>
            {o.items.map((i) => (
              <div key={i.id} style={{ fontSize: 14 }}>{i.title} × {i.quantity} — ${i.price.toFixed(2)}</div>
            ))}
          </div>
          <strong>${o.total.toFixed(2)}</strong>
        </div>
      ))}
      {loaded && orders.length === 0 && <p>Заказов пока нет. <a href="/">К каталогу</a></p>}
    </div>
  );
}
