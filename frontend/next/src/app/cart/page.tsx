"use client";

// Корзина: клиентский компонент на SDK (токен/гость в localStorage)
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, errorMessage } from "@/shared/client-api";

interface CartItem {
  id: string;
  quantity: number;
  lineTotal: number;
  product: { id: string; title: string; price: number; images?: Array<{ url: string; isPrimary: boolean }> };
}

interface CartView {
  id: string;
  subtotal: number;
  items: CartItem[];
}

export default function CartPage() {
  const [cart, setCart] = useState<CartView | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await api.cart.getCart();
      const body = res.data as any;
      setCart({ id: body.id, subtotal: body.subtotal ?? 0, items: body.items ?? [] });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setQty(itemId: string, quantity: number) {
    if (quantity < 1) return;
    const res = await api.cart.updateCartItem(itemId, { quantity });
    const body = res.data as any;
    setCart({ id: body.id, subtotal: body.subtotal ?? 0, items: body.items ?? [] });
  }

  async function remove(itemId: string) {
    const res = await api.cart.deleteCartItem(itemId);
    const body = res.data as any;
    setCart({ id: body.id, subtotal: body.subtotal ?? 0, items: body.items ?? [] });
  }

  const image = (item: CartItem) =>
    item.product.images?.find((x) => x.isPrimary)?.url ?? item.product.images?.[0]?.url ?? "";

  return (
    <div>
      <h1>Корзина</h1>
      {error && <div className="error">{error}</div>}
      {!cart || cart.items.length === 0 ? (
        <p>Корзина пуста. <Link href="/">К каталогу</Link></p>
      ) : (
        <>
          {cart.items.map((item) => (
            <div key={item.id} className="row">
              <img src={image(item)} alt="" />
              <div style={{ flex: 1 }}>
                <div>{item.product.title}</div>
                <div style={{ color: "#777", fontSize: 13 }}>
                  ${item.product.price.toFixed(2)} × {item.quantity} = ${item.lineTotal.toFixed(2)}
                </div>
              </div>
              <button onClick={() => setQty(item.id, item.quantity - 1)}>−</button>
              <span>{item.quantity}</span>
              <button onClick={() => setQty(item.id, item.quantity + 1)}>+</button>
              <button onClick={() => remove(item.id)}>✕</button>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, alignItems: "center" }}>
            <strong>Итого: ${cart.subtotal.toFixed(2)}</strong>
            <Link href="/checkout"><button>Оформить заказ</button></Link>
          </div>
        </>
      )}
    </div>
  );
}
