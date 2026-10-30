import { useEffect } from "react";
import { Link } from "react-router-dom";
import { List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton, Typography, Button, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import { errorMessage } from "../shared/api";
import { useApp } from "../shared/store";

export default function CartPage() {
  const { cart, loadCart, setQty, removeItem } = useApp();

  useEffect(() => {
    loadCart().catch((e) => <Alert severity="error">{errorMessage(e)}</Alert>);
  }, [loadCart]);

  const items = cart?.items ?? [];

  return (
    <>
      <Typography variant="h5" mb={2}>Корзина</Typography>
      {items.length === 0 ? (
        <Alert severity="info">Корзина пуста. <Link to="/">К каталогу</Link></Alert>
      ) : (
        <>
          <List sx={{ bgcolor: "background.paper", border: "1px solid #ddd", borderRadius: 2 }}>
            {items.map((item) => (
              <ListItem key={item.id} secondaryAction={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IconButton onClick={() => item.quantity > 1 && setQty(item.id, item.quantity - 1)}>
                    <RemoveIcon />
                  </IconButton>
                  <span>{item.quantity}</span>
                  <IconButton onClick={() => setQty(item.id, item.quantity + 1)}><AddIcon /></IconButton>
                  <IconButton color="error" onClick={() => removeItem(item.id)}><DeleteIcon /></IconButton>
                </div>
              }>
                <ListItemAvatar>
                  <Avatar variant="rounded" src={item.product.image ?? undefined} />
                </ListItemAvatar>
                <ListItemText
                  primary={item.product.title}
                  secondary={`$${item.product.price.toFixed(2)} × ${item.quantity} = $${item.lineTotal.toFixed(2)}`}
                />
              </ListItem>
            ))}
          </List>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginTop: 16 }}>
            <Typography variant="h6">Итого: ${cart!.subtotal.toFixed(2)}</Typography>
            <Button variant="contained" size="large" component={Link} to="/checkout">Оформить заказ</Button>
          </div>
        </>
      )}
    </>
  );
}
