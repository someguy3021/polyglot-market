import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { api, errorMessage } from "../api";

interface AdminOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ id: string; title: string; quantity: number }>;
}

// Статусная машина заказа (контракт: PUT /admin/orders/{id}/status)
const TRANSITIONS: Record<string, string[]> = {
  new: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["done"],
  done: [],
  cancelled: [],
};
const labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: () => api.admin.listAllOrders(1, 50, (status || undefined) as never),
  });
  const orders = (data?.data?.data ?? []) as AdminOrder[];

  async function changeStatus(id: string, next: string) {
    try {
      await api.admin.updateOrderStatus(id, { status: next as never });
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (err) {
      setError(errorMessage(err));
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  }

  return (
    <>
      <Typography variant="h5" mb={2}>Админ — заказы</Typography>
      {error && <Typography color="error" mb={2}>{error}</Typography>}
      <Select size="small" value={status} displayEmpty onChange={(e) => setStatus(e.target.value)} sx={{ mb: 2, minWidth: 200 }}>
        <MenuItem value="">Все статусы</MenuItem>
        {Object.entries(labels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
      </Select>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Заказ</TableCell><TableCell>Позиции</TableCell><TableCell>Сумма</TableCell><TableCell>Создан</TableCell><TableCell>Статус →</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>#{o.id.slice(0, 8)}…</TableCell>
              <TableCell>
                {o.items.map((i) => <div key={i.id} style={{ fontSize: 12 }}>{i.title} × {i.quantity}</div>)}
              </TableCell>
              <TableCell>${o.total.toFixed(2)}</TableCell>
              <TableCell>{new Date(o.createdAt).toLocaleString("ru")}</TableCell>
              <TableCell>
                <Select size="small" value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} sx={{ minWidth: 150 }}>
                  {([o.status, ...(TRANSITIONS[o.status] ?? [])] as string[]).map((s) => (
                    <MenuItem key={s} value={s}>{labels[s] ?? s}</MenuItem>
                  ))}
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
