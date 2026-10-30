import VueRouter from "vue-router";

export const routes = [
  { path: "/", component: () => import("../pages/CatalogPage.vue") },
  { path: "/product/:id", component: () => import("../pages/ProductPage.vue") },
  { path: "/cart", component: () => import("../pages/CartPage.vue") },
  { path: "/checkout", component: () => import("../pages/CheckoutPage.vue"), meta: { auth: true } },
  { path: "/orders", component: () => import("../pages/OrdersPage.vue"), meta: { auth: true } },
  { path: "/login", component: () => import("../pages/LoginPage.vue") },
  { path: "/register", component: () => import("../pages/LoginPage.vue"), meta: { register: true } },
  { path: "/seller/products", component: () => import("../pages/SellerProductsPage.vue"), meta: { auth: true, roles: ["seller"] } },
  { path: "/moderator/queue", component: () => import("../pages/ModeratorQueuePage.vue"), meta: { auth: true, roles: ["moderator", "admin"] } },
  { path: "/admin/orders", component: () => import("../pages/AdminOrdersPage.vue"), meta: { auth: true, roles: ["admin"] } },
  { path: "*", redirect: "/" },
];

// Guard: meta.auth и meta.roles (паритет с Quasar-фронтом)
export const router = new VueRouter({
  mode: "history",
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("pm.token");
  const user = JSON.parse(localStorage.getItem("pm.user") || "null");
  if (to.meta.auth && !token) return next({ path: "/login", query: { next: to.fullPath } });
  if (to.meta.roles && user && !to.meta.roles.includes(user.role)) return next("/");
  next();
});
