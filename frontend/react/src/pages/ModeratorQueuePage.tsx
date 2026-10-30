import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from "@mui/material";
import { api, errorMessage } from "../shared/api";

interface QueueItem {
  id: string;
  title: string;
  price: number;
  seller: { shopName: string };
}

export default function ModeratorQueuePage() {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["queue"],
    queryFn: () => api.moderation.moderationQueue(1, 50),
  });
  const queue = (data?.data?.data ?? []) as QueueItem[];

  async function approve(id: string) {
    try {
      await api.moderation.approveProduct(id);
      void qc.invalidateQueries({ queryKey: ["queue"] });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function reject() {
    if (!rejecting) return;
    try {
      await api.moderation.rejectProduct(rejecting, { reason });
      setRejecting(null);
      setReason("");
      void qc.invalidateQueries({ queryKey: ["queue"] });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <Typography variant="h5" mb={2}>Очередь модерации</Typography>
      {error && <Typography color="error" mb={2}>{error}</Typography>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Товар</TableCell><TableCell>Цена</TableCell><TableCell>Продавец</TableCell><TableCell>Решение</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {queue.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.title}</TableCell>
              <TableCell>${p.price.toFixed(2)}</TableCell>
              <TableCell>{p.seller.shopName}</TableCell>
              <TableCell>
                <Button size="small" color="success" variant="contained" sx={{ mr: 1 }} onClick={() => approve(p.id)}>Одобрить</Button>
                <Button size="small" color="error" variant="contained" onClick={() => setRejecting(p.id)}>Отклонить</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={rejecting !== null} onClose={() => setRejecting(null)}>
        <DialogTitle>Причина отклонения</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth multiline value={reason} onChange={(e) => setReason(e.target.value)}
            label="Что исправить продавцу" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejecting(null)}>Отмена</Button>
          <Button color="error" variant="contained" onClick={reject}>Отклонить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
