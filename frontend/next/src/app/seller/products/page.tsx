"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/shared/client-api";

interface SellerProduct {
  id: string; title: string; price: number; stock: number;
  status: string; rejectionReason: string | null;
}

const labels: Record<string, string> = { draft: "черновик", pending_moderation: "на модерации", approved: "в продаже", rejected: "отклонён" };

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await api.seller.listSellerProducts(1, 50);
    // локальный SellerProduct уже соответствует Product из контракта
    setProducts(res.data.data as SellerProduct[]);
  }

  async function submit(id: string) {
    try {
      await api.seller.submitSellerProduct(id);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function upload(id: string, file: File | null) {
    if (!file) return;
    try {
      await api.seller.uploadProductImage(id, file);
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
      <h1>Мои товары</h1>
      {error && <div className="error">{error}</div>}
      <table width="100%">
        <thead><tr><th align="left">Товар</th><th align="left">Цена</th><th align="left">Остаток</th><th align="left">Статус</th><th align="left">Действия</th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>${p.price.toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>
                {labels[p.status] ?? p.status}
                {p.rejectionReason && <div style={{ color: "#c62828", fontSize: 12 }}>{p.rejectionReason}</div>}
              </td>
              <td>
                {["draft", "rejected"].includes(p.status) && (
                  <button onClick={() => submit(p.id)}>На модерацию</button>
                )}
                {["draft", "approved"].includes(p.status) && (
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload(p.id, e.target.files?.[0] ?? null)} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
