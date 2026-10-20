"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/client-api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await api.auth.login({ email: form.email, password: form.password });
      localStorage.setItem("pm.token", res.data.token);
      localStorage.setItem("pm.user", JSON.stringify(res.data.user));
      const cartToken = localStorage.getItem("pm.cart");
      if (cartToken) {
        try {
          await api.cart.mergeCart({ token: cartToken });
          localStorage.removeItem("pm.cart");
        } catch {
          /* мердж не критичен */
        }
      }
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f0) => ({ ...f0, [f]: e.target.value }));

  return (
    <div className="wrap" style={{ maxWidth: 440 }}>
      <h1>Вход</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="Email" type="email" value={form.email} onChange={set("email")} />
        <input placeholder="Пароль" type="password" value={form.password} onChange={set("password")} />
        {error && <div className="error">{error}</div>}
        <button disabled={busy} onClick={submit}>{busy ? "…" : "Войти"}</button>
        <p style={{ color: "#777", fontSize: 12 }}>
          Демо: buyer@demo.dev, seller@demo.dev, moderator@demo.dev, admin@demo.dev — пароль «password».
          (Регистрация — на флагманских фронтах.)
        </p>
      </div>
    </div>
  );
}
