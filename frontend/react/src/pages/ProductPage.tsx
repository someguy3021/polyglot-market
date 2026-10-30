import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardMedia, Typography, Button, TextField, Skeleton, Chip as StockBadge } from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { api, errorMessage } from "../shared/api";
import { useApp } from "../shared/store";

interface ProductView {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: { name: string };
  seller: { shopName: string };
  images: Array<{ id: string; url: string; thumbUrl: string | null; isPrimary: boolean }>;
}

export default function ProductPage() {
  const { id } = useParams();
  const addToCart = useApp((s) => s.addToCart);
  const [qty, setQty] = useState(1);
  const [current, setCurrent] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.catalog.getProduct(id!),
    enabled: Boolean(id),
  });

  if (isLoading) return <Skeleton variant="rounded" height={420} />;
  const product = data?.data as ProductView | undefined;
  if (!product) return <Typography>Товар не найден.</Typography>;

  const primary = current || product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || "";

  return (
    <Card sx={{ p: 3 }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <CardMedia component="img" image={primary} style={{ maxHeight: 420, objectFit: "contain" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {product.images.map((img) => (
              <CardMedia
                key={img.id}
                component="img"
                image={img.thumbUrl ?? img.url}
                onClick={() => setCurrent(img.url)}
                style={{
                  width: 72, height: 56, borderRadius: 6, cursor: "pointer",
                  outline: img.url === primary ? "2px solid #1f4a7a" : "none",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 320px" }}>
          <Typography variant="h5">{product.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {product.category.name} · продает {product.seller.shopName}
          </Typography>
          <Typography variant="h4" sx={{ mt: 2 }}>${product.price.toFixed(2)}</Typography>
          <Typography variant="body2" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>{product.description}</Typography>
          <StockBadge color={product.stock > 0 ? "success" : "default"}
            label={product.stock > 0 ? `в наличии: ${product.stock}` : "нет в наличии"} sx={{ mt: 1 }} />
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 24 }}>
            <TextField type="number" size="small" value={qty} sx={{ width: 90 }}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
            <Button
              variant="contained"
              startIcon={<AddShoppingCartIcon />}
              disabled={product.stock <= 0}
              onClick={async () => {
                const err = await addToCart(product.id, qty);
                setError(err ?? "");
              }}
            >
              Добавить в корзину
            </Button>
            {error && <Typography color="error">{error}</Typography>}
          </div>
        </div>
      </div>
    </Card>
  );
}
