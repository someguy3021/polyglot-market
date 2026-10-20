import { useQuery } from "@tanstack/react-query";
import { Card, Typography, Chip } from "@mui/material";
import { api } from "../api";

interface OrderView {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  shippingMethod: { name: string };
  items: Array<{ id: string; title: string; quantity: number; price: number }>;
}

const labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };
const colors: Record<string, "primary" | "warning" | "secondary" | "success" | "error"> = {
  new: "primary", paid: "warning", shipped: "secondary", done: "success", cancelled: "error",
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.orders.listMyOrders(1, 20),
  });
  const orders = (data?.data?.data ?? []) as OrderView[];

  return (
    <>
      <Typography variant="h5" mb={2}>Мои заказы</Typography>
      {orders.map((o) => (
        <Card key={o.id} sx={{ p: 2, mb: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Typography variant="subtitle1">
                Заказ #{o.id.slice(0, 8)}…
                <Chip size="small" color={colors[o.status] ?? "default"} label={labels[o.status] ?? o.status} sx={{ ml: 1 }} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(o.createdAt).toLocaleString("ru")} · {o.shippingMethod.name}
              </Typography>
            </div>
            <Typography variant="h6">${o.total.toFixed(2)}</Typography>
          </div>
          {o.items.map((i) => (
            <Typography key={i.id} variant="body2">{i.title} × {i.quantity} — ${i.price.toFixed(2)}</Typography>
          ))}
        </Card>
      ))}
      {!isLoading && orders.length === 0 && (
        <Typography color="text.secondary">Заказов пока нет.</Typography>
      )}
    </>
  );
}
