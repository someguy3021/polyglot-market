import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Typography, Chip, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from "@mui/material";
import { api, errorMessage } from "../api";

interface SellerProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: string;
  rejectionReason: string | null;
}

const labels: Record<string, string> = { draft: "черновик", pending_moderation: "на модерации", approved: "в продаже", rejected: "отклонён" };
const colors: Record<string, "default" | "warning" | "success" | "error"> = {
  draft: "default", pending_moderation: "warning", approved: "success", rejected: "error",
};

export default function SellerProductsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", price: 0, stock: 0, categoryId: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["seller-products"],
    queryFn: () => api.seller.listSellerProducts(1, 50),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.catalog.listCategories(),
  });

  const products = (data?.data?.data ?? []) as SellerProduct[];

  async function create() {
    try {
      await api.seller.createSellerProduct({
        title: form.title,
        description: form.description || "",
        price: form.price,
        stock: form.stock,
        categoryId: form.categoryId,
      });
      setCreateOpen(false);
      setError("");
      void qc.invalidateQueries({ queryKey: ["seller-products"] });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function submit(id: string) {
    try {
      await api.seller.submitSellerProduct(id);
      void qc.invalidateQueries({ queryKey: ["seller-products"] });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function upload(productId: string, file: File | null) {
    if (!file) return;
    try {
      await api.seller.uploadProductImage(productId, file);
      void qc.invalidateQueries({ queryKey: ["seller-products"] });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Typography variant="h5">Мои товары</Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>Новый товар</Button>
      </div>
      {error && <Typography color="error" mb={2}>{error}</Typography>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Товар</TableCell><TableCell>Цена</TableCell><TableCell>Остаток</TableCell><TableCell>Статус</TableCell><TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.title}</TableCell>
              <TableCell>${p.price.toFixed(2)}</TableCell>
              <TableCell>{p.stock}</TableCell>
              <TableCell>
                <Chip size="small" color={colors[p.status] ?? "default"} label={labels[p.status] ?? p.status} />
                {p.rejectionReason && <div style={{ color: "#d32f2f", fontSize: 12 }}>{p.rejectionReason}</div>}
              </TableCell>
              <TableCell>
                {["draft", "rejected"].includes(p.status) && (
                  <Button size="small" variant="contained" onClick={() => submit(p.id)}>На модерацию</Button>
                )}
                {["draft", "approved"].includes(p.status) && (
                  <input type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => upload(p.id, e.target.files?.[0] ?? null)} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>Новый товар</DialogTitle>
        <DialogContent style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 420 }}>
          <TextField label="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div style={{ display: "flex", gap: 12 }}>
            <TextField label="Цена $" type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <TextField label="Остаток" type="number" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <TextField select label="Категория" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} SelectProps={{ native: true }}>
            <option value=""></option>
            {(categories?.data?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={create}>Создать черновик</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
