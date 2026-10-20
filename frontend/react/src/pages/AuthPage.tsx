import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, TextField, Button, Typography, Alert } from "@mui/material";
import { errorMessage } from "../api";
import { useApp } from "../store";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const login = useApp((s) => s.login);
  const register = useApp((s) => s.register);
  const loadCart = useApp((s) => s.loadCart);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      await loadCart();
      navigate((location.state as { next?: string })?.next ?? "/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Card sx={{ p: 4, maxWidth: 460, mx: "auto", mt: 4 }}>
      <Typography variant="h5" mb={2}>{isRegister ? "Регистрация" : "Вход"}</Typography>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {isRegister && (
          <TextField label="Имя" value={form.name} onChange={set("name")} />
        )}
        <TextField label="Email" type="email" value={form.email} onChange={set("email")} />
        <TextField
          label="Пароль" type="password" value={form.password} onChange={set("password")}
          helperText={isRegister ? "минимум 8 символов" : undefined}
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button variant="contained" disabled={busy} onClick={submit}>
          {isRegister ? "Создать аккаунт" : "Войти"}
        </Button>
        <Typography variant="caption" color="text.secondary">
          Демо-аккаунты: buyer@demo.dev, seller@demo.dev, moderator@demo.dev, admin@demo.dev — пароль «password».
        </Typography>
      </div>
    </Card>
  );
}
