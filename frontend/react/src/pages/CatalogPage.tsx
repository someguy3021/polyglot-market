import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardMedia, CardContent, CardActions, Grid2 as Grid, TextField, MenuItem, Button, Typography, Chip as StockBadge, Pagination, Skeleton, Alert } from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { api, errorMessage } from "../shared/api";
import { useApp } from "../shared/store";

interface ProductCard {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: { name: string };
  seller: { shopName: string };
  images: Array<{ url: string; isPrimary: boolean }>;
}

const sortOptions = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "price_asc", label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
];

export default function CatalogPage() {
  const navigate = useNavigate();
  const addToCart = useApp((s) => s.addToCart);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("newest");

  const { data, isLoading } = useQuery({
    queryKey: ["products", page, q, category, priceMin, priceMax, sort],
    queryFn: () => api.catalog.listProducts(
      page, 20, category || undefined, undefined,
      q || undefined,
      priceMin ? Number(priceMin) : undefined,
      priceMax ? Number(priceMax) : undefined,
      sort as never,
    ),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.catalog.listCategories(),
  });

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 350);
    return () => clearTimeout(timer);
  }, [q]);

  const products = (data?.data?.data ?? []) as ProductCard[];
  const meta = data?.data?.meta;

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth size="small" label="Поиск по названию" value={q}
            onChange={(e) => setQ(e.target.value)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField fullWidth select size="small" label="Категория" value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <MenuItem value="">Все</MenuItem>
            {(categories?.data?.data ?? []).map((c) => (
              <MenuItem key={c.id} value={c.slug}>{c.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 3, md: 2 }}>
          <TextField fullWidth size="small" type="number" label="Цена от" value={priceMin}
            onChange={(e) => { setPriceMin(e.target.value); setPage(1); }} />
        </Grid>
        <Grid size={{ xs: 3, md: 2 }}>
          <TextField fullWidth size="small" type="number" label="до" value={priceMax}
            onChange={(e) => { setPriceMax(e.target.value); setPage(1); }} />
        </Grid>
        <Grid size={{ xs: 12, md: 1 }}>
          <TextField fullWidth select size="small" value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            {sortOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      {error && <Alert severity="error">{error}</Alert>}
      {isLoading && (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, md: 3 }}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
          ))}
        </Grid>
      )}

      <Grid container spacing={2}>
        {products.map((p) => (
          <Grid key={p.id} size={{ xs: 6, md: 3 }}>
            <Card sx={{ cursor: "pointer", height: "100%" }} onClick={() => navigate(`/product/${p.id}`)}>
              <CardMedia
                component="img"
                height={180}
                image={p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? ""}
                alt={p.title}
              />
              <CardContent>
                <Typography variant="subtitle2" noWrap={false} minHeight={40}>{p.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.category.name} · {p.seller.shopName}
                </Typography>
                <Typography variant="h6">${p.price.toFixed(2)}</Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "space-between" }}>
                <StockBadge
                  color={p.stock > 0 ? "success" : "default"}
                  label={p.stock > 0 ? `в наличии: ${p.stock}` : "нет в наличии"}
                />
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddShoppingCartIcon />}
                  disabled={p.stock <= 0}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const err = await addToCart(p.id, 1);
                    if (err) setError(err);
                  }}
                >
                  В корзину
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {!isLoading && products.length === 0 && (
        <Alert severity="info">Ничего не найдено — смягчите фильтры.</Alert>
      )}

      {meta && meta.lastPage > 1 && (
        <Pagination page={page} count={meta.lastPage} onChange={(_, v) => setPage(v)}
          sx={{ mt: 4, display: "flex", justifyContent: "center" }} />
      )}
    </>
  );
}
