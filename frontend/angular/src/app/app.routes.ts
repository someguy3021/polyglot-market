import { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "", loadComponent: () => import("./pages/catalog.component").then((m) => m.CatalogComponent) },
  { path: "product/:id", loadComponent: () => import("./pages/product.component").then((m) => m.ProductComponent) },
  { path: "cart", loadComponent: () => import("./pages/cart.component").then((m) => m.CartComponent) },
  { path: "checkout", loadComponent: () => import("./pages/checkout.component").then((m) => m.CheckoutComponent) },
  { path: "orders", loadComponent: () => import("./pages/orders.component").then((m) => m.OrdersComponent) },
  { path: "login", loadComponent: () => import("./pages/login.component").then((m) => m.LoginComponent) },
  { path: "register", loadComponent: () => import("./pages/login.component").then((m) => m.LoginComponent), data: { register: true } },
  { path: "seller/products", loadComponent: () => import("./pages/seller.component").then((m) => m.SellerComponent) },
  { path: "moderator/queue", loadComponent: () => import("./pages/moderator.component").then((m) => m.ModeratorComponent) },
  { path: "admin/orders", loadComponent: () => import("./pages/admin.component").then((m) => m.AdminComponent) },
  { path: "**", redirectTo: "" },
];
