"use client";

// Карточка товара: клиентский компонент на SDK (добавление в корзину).
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorMessage } from "@/shared/client-api";

interface ProductView {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: { name: string };
  seller: { shopName: string };
  images: Array<{ id: string; url: string; thumbUrl: string | null; isPrimary: boolean }>;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductView | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    api.catalog
      .getProduct(id)
      .then((r) => setProduct(r.data as ProductView))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  async function add() {
    if (!product) return;
    try {
      const res = await api.cart.addCartItem({ productId: product.id, quantity: qty });
      // гостевая корзина: токен из заголовка ответа — без него корзина «потеряется»
      const header = (res.headers as Record<string, string | string[] | undefined> | undefined)?.["x-cart-token"]
        ?? (res.headers as Record<string, string | string[] | undefined> | undefined)?.["X-Cart-Token"];
      if (typeof header === "string") localStorage.setItem("pm.cart", header);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (!product) return <p>{error || "Загрузка…"}</p>;
  const primary = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url ?? "";

  return (
    <div className="wrap" style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
      <img src={primary} alt={product.title} style={{ flex: "1 1 320px", maxHeight: 420, objectFit: "contain" }} />
      <div style={{ flex: "1 1 320px" }}>
        <h1 style={{ fontSize: 24 }}>{product.title}</h1>
        <p style={{ color: "#777", fontSize: 13 }}>{product.category.name} · продает {product.seller.shopName}</p>
        <p style={{ fontSize: 32, fontWeight: 700 }}>${product.price.toFixed(2)}</p>
        <p>{product.description}</p>
        <span className="stock" style={product.stock <= 0 ? { color: "#999" } : undefined}>
          {product.stock > 0 ? `в наличии: ${product.stock}` : "нет в наличии"}
        </span>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <input
            type="number"
            value={qty}
            min={1}
            max={product.stock}
            style={{ width: 80 }}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          />
          <button disabled={product.stock <= 0} onClick={add}>Добавить в корзину</button>
          {error && <span className="error">{error}</span>}
        </div>
      </div>
    </div>
  );
}
