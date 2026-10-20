import { Routes, Route, Link, NavLink, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Badge, Button, IconButton, Box } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LogoutIcon from "@mui/icons-material/Logout";
import { useApp } from "./store";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import AuthPage from "./pages/AuthPage";
import SellerProductsPage from "./pages/SellerProductsPage";
import ModeratorQueuePage from "./pages/ModeratorQueuePage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import RequireAuth from "./pages/RequireAuth";

export default function App() {
  const { user, cart, logout } = useApp();
  const navigate = useNavigate();
  const role = user?.role;

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ cursor: "pointer", mr: 3 }} onClick={() => navigate("/")}>
            Polyglot Market {role && <small style={{ opacity: 0.7 }}>({role})</small>}
          </Typography>
          <Button color="inherit" component={NavLink} to="/">Каталог</Button>
          <Button color="inherit" component={NavLink} to="/cart">
            <Badge badgeContent={cart?.items.length ?? 0} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </Button>
          {role === "seller" && <Button color="inherit" component={NavLink} to="/seller/products">Мои товары</Button>}
          {(role === "moderator" || role === "admin") && (
            <Button color="inherit" component={NavLink} to="/moderator/queue">Модерация</Button>
          )}
          {role === "admin" && <Button color="inherit" component={NavLink} to="/admin/orders">Админ</Button>}
          {user ? (
            <>
              <Button color="inherit" component={NavLink} to="/orders">Заказы</Button>
              <IconButton color="inherit" onClick={() => { logout(); navigate("/"); }}>
                <LogoutIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Войти</Button>
              <Button color="inherit" component={Link} to="/register">Регистрация</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" flexGrow={1} p={3} maxWidth={1200} width="100%" mx="auto">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/seller/products" element={
            <RequireAuth roles={["seller"]}><SellerProductsPage /></RequireAuth>
          } />
          <Route path="/moderator/queue" element={
            <RequireAuth roles={["moderator", "admin"]}><ModeratorQueuePage /></RequireAuth>
          } />
          <Route path="/admin/orders" element={
            <RequireAuth roles={["admin"]}><AdminOrdersPage /></RequireAuth>
          } />
        </Routes>
      </Box>
      <Box component="footer" p={2} textAlign="center" color="#666">
        Polyglot Market — React + MUI · демо: buyer@demo.dev / password
      </Box>
    </Box>
  );
}
