import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, TextField, Button, Typography, Chip, Alert } from "@mui/material";
import { api, errorMessage, setOrderIdempotencyKey } from "../api";
import { useApp } from "../store";

interface ShippingMethod { code: string; name: string; price: number; etaDays: number }
interface PromoView { code: string; valid: boolean; discount: number }

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loadCart } = useApp();
  const [shipping, setShipping] = useState<ShippingMethod[]>([]);
  const [method, setMethod] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<PromoView | null>(null);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", zip: "", country: "US" });

  const { data: methods } = useQuery({
    queryKey: ["shipping"],
    queryFn: async () => (await api.http.get("/shipping-methods")).data as { data: ShippingMethod[] },
  });

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (methods?.data?.length) setShipping(methods.data);
  }, [methods]);

  useEffect(() => {
    if (shipping.length > 0 && !method) setMethod(shipping[0]!.code);
  }, [shipping, method]);

  const shippingPrice = shipping.find((m) => m.code === method)?.price ?? 0;
  const discount = promo?.valid ? promo.discount : 0;
  const total = Math.max(0, (cart?.subtotal ?? 0) - discount) + shippingPrice;
  const canPlace = (cart?.items.length ?? 0) > 0 && method !== "" && address.line1 !== "" && address.city !== "" && address.zip !== "";

  async function checkPromo() {
    if (!promoCode) return;
    try {
      const res = await api.orders.validatePromo({ code: promoCode, subtotal: cart!.subtotal });
      setPromo(res.data as PromoView);
      setError("");
    } catch (err) {
      setPromo(null);
      setError(errorMessage(err));
    }
  }

  async function placeOrder() {
    setPlacing(true);
    // Идемпотентность (ADR-011): ключ на попытку
    const idemKey = crypto.randomUUID();
    setOrderIdempotencyKey(idemKey);
    try {
      await api.orders.createOrder(idemKey, {
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
      await loadCart();
      navigate("/orders");
    } catch (err) {
      setOrderIdempotencyKey(undefined);
      setError(errorMessage(err));
    } finally {
      setPlacing(false);
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((a) => ({ ...a, [field]: e.target.value }));

  return (
    <Card sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h5" mb={2}>Оформление заказа</Typography>
      {(cart?.items.length ?? 0) === 0 && (
        <Alert severity="info">Корзина пуста. <a href="/">К каталогу</a></Alert>
      )}

      <FormLabel>1. Доставка</FormLabel>
      <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
        {shipping.map((m) => (
          <FormControlLabel key={m.code} value={m.code} control={<Radio />}
            label={`${m.name} — $${m.price.toFixed(2)} · ${m.etaDays} дн.`} />
        ))}
      </RadioGroup>

      <FormLabel sx={{ display: "block", mt: 2 }}>2. Промокод</FormLabel>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <TextField size="small" label="Промокод (например WELCOME10)" value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)} style={{ width: 320 }} />
        <Button onClick={checkPromo}>Проверить</Button>
        {promo?.valid && <Chip color="success" label={`скидка $${promo.discount.toFixed(2)}`} />}
      </div>

      <FormLabel sx={{ display: "block" }}>3. Адрес</FormLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
        <TextField size="small" label="Улица, дом" value={address.line1} onChange={set("line1")} style={{ flex: "1 1 260px" }} />
        <TextField size="small" label="Квартира (опц.)" value={address.line2} onChange={set("line2")} style={{ flex: "1 1 200px" }} />
        <TextField size="small" label="Город" value={address.city} onChange={set("city")} style={{ width: 180 }} />
        <TextField size="small" label="Индекс" value={address.zip} onChange={set("zip")} style={{ width: 140 }} />
        <TextField size="small" label="Страна" value={address.country} onChange={set("country")} style={{ width: 100 }} />
      </div>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginTop: 24 }}>
        <Typography color="text.secondary">
          Товары: ${(cart?.subtotal ?? 0).toFixed(2)}
          {discount > 0 && <> · скидка: −${discount.toFixed(2)}</>}
          {method && <> · доставка: ${shippingPrice.toFixed(2)}</>}
        </Typography>
        <Typography variant="h6">К оплате: ${total.toFixed(2)}</Typography>
        <Button variant="contained" size="large" disabled={!canPlace || placing} onClick={placeOrder}>
          {placing ? "Оформляем…" : "Подтвердить заказ"}
        </Button>
      </div>
    </Card>
  );
}
