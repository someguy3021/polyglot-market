"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage, setOrderIdempotencyKey } from "@/lib/client-api";

interface ShippingMethod { code: string; name: string; price: number; etaDays: number }
interface PromoView { code: string; valid: boolean; discount: number }
interface CartView { id: string; subtotal: number; items: Array<any> }

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartView | null>(null);
  const [shipping, setShipping] = useState<ShippingMethod[]>([]);
  const [method, setMethod] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<PromoView | null>(null);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", zip: "", country: "US" });

  useEffect(() => {
    api.cart.getCart().then((r) => {
      const b = r.data as any;
      setCart({ id: b.id, subtotal: b.subtotal ?? 0, items: b.items ?? [] });
    });
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipping-methods`)
      .then((r) => r.json())
      .then((b) => setShipping(b.data));
  }, []);

  const shippingPrice = shipping.find((m) => m.code === method)?.price ?? 0;
  const discount = promo?.valid ? promo.discount : 0;
  const total = Math.max(0, (cart?.subtotal ?? 0) - discount) + shippingPrice;
  const canPlace = (cart?.items.length ?? 0) > 0 && method !== "" && address.line1 !== "" && address.city !== "" && address.zip !== "";

  async function checkPromo() {
    try {
      const res = await api.orders.validatePromo({ code: promoCode, subtotal: cart!.subtotal });
      setPromo((res.data as any).valid ? (res.data as any) : null);
      setError("");
    } catch (err) {
      setPromo(null);
      setError(errorMessage(err));
    }
  }

  async function place() {
    setPlacing(true);
    const key = crypto.randomUUID();
    setOrderIdempotencyKey(key);
    try {
      await api.orders.createOrder(key, {
        shippingMethodCode: method,
        promoCode: promo?.valid ? promoCode || undefined : undefined,
        shippingAddress: {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          zip: address.zip,
          country: address.country.toUpperCase(),
        },
      });
      setOrderIdempotencyKey(undefined);
      router.push("/orders");
    } catch (err) {
      setOrderIdempotencyKey(undefined);
      setError(errorMessage(err));
    } finally {
      setPlacing(false);
    }
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setAddress((a) => ({ ...a, [f]: e.target.value }));

  return (
    <div className="wrap">
      <h1>Оформление заказа</h1>
      {(cart?.items.length ?? 0) === 0 ? (
        <p>Корзина пуста. <a href="/">К каталогу</a></p>
      ) : (
        <>
          <h3>1. Доставка</h3>
          {shipping.map((m) => (
            <label key={m.code} style={{ display: "block", padding: "4px 0" }}>
              <input type="radio" name="method" checked={method === m.code} onChange={() => setMethod(m.code)} />
              {" "}{m.name} — ${m.price.toFixed(2)} · {m.etaDays} дн.
            </label>
          ))}
          <h3>2. Промокод</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input placeholder="WELCOME10" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} style={{ width: 280 }} />
            <button onClick={checkPromo}>Проверить</button>
            {promo?.valid && <span className="notice">скидка ${promo.discount.toFixed(2)}</span>}
          </div>
          <h3>3. Адрес</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <input placeholder="Улица, дом" value={address.line1} onChange={set("line1")} style={{ flex: "1 1 240px" }} />
            <input placeholder="Квартира" value={address.line2} onChange={set("line2")} style={{ flex: "1 1 180px" }} />
            <input placeholder="Город" value={address.city} onChange={set("city")} />
            <input placeholder="Индекс" value={address.zip} onChange={set("zip")} />
            <input placeholder="US" value={address.country} onChange={set("country")} size={3} />
          </div>
          {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, alignItems: "center", marginTop: 20 }}>
            <span>Товары: ${(cart?.subtotal ?? 0).toFixed(2)} · доставка: ${shippingPrice.toFixed(2)}</span>
            <strong style={{ fontSize: 18 }}>К оплате: ${total.toFixed(2)}</strong>
            <button disabled={!canPlace || placing} onClick={place}>{placing ? "…" : "Подтвердить заказ"}</button>
          </div>
        </>
      )}
    </div>
  );
}
