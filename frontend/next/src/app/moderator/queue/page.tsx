"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/client-api";

export default function ModeratorQueuePage() {
  const [queue, setQueue] = useState<Array<any>>([]);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await api.moderation.moderationQueue(1, 50);
    setQueue(res.data.data);
  }

  async function approve(id: string) {
    try {
      await api.moderation.approveProduct(id);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function reject() {
    if (!rejecting) return;
    try {
      await api.moderation.rejectProduct(rejecting, { reason });
      setRejecting(null);
      setReason("");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1>Очередь модерации</h1>
      {error && <div className="error">{error}</div>}
      <table width="100%">
        <thead><tr><th align="left">Товар</th><th align="left">Цена</th><th align="left">Продавец</th><th align="left">Решение</th></tr></thead>
        <tbody>
          {queue.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>${p.price.toFixed(2)}</td>
              <td>{p.seller.shopName}</td>
              <td>
                <button style={{ background: "#2e7d32", marginRight: 6 }} onClick={() => approve(p.id)}>Одобрить</button>
                <button style={{ background: "#c62828" }} onClick={() => setRejecting(p.id)}>Отклонить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rejecting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, width: 420 }}>
            <h3>Причина отклонения</h3>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: "100%", height: 110 }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
              <button onClick={() => setRejecting(null)}>Отмена</button>
              <button style={{ background: "#c62828", color: "#fff" }} onClick={reject}>Отклонить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
