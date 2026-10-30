import { createRouter, createWebHistory } from "vue-router";
import { useSession } from "../../shared/stores/session";

const routes = [
  { path: "/", name: "catalog", component: () => import("../../pages/CatalogPage.vue") },
  { path: "/product/:id", name: "product", component: () => import("../../pages/ProductPage.vue") },
  { path: "/cart", name: "cart", component: () => import("../../pages/CartPage.vue") },
  { path: "/checkout", name: "checkout", component: () => import("../../pages/CheckoutPage.vue"), meta: { auth: true } },
  { path: "/orders", name: "orders", component: () => import("../../pages/OrdersPage.vue"), meta: { auth: true } },
  { path: "/login", name: "login", component: () => import("../../pages/LoginPage.vue") },
  { path: "/register", name: "register", component: () => import("../../pages/RegisterPage.vue") },
  { path: "/seller/products", name: "seller-products", component: () => import("../../pages/SellerProductsPage.vue"), meta: { auth: true, roles: ["seller"] } },
  { path: "/moderator/queue", name: "moderator-queue", component: () => import("../../pages/ModeratorQueuePage.vue"), meta: { auth: true, roles: ["moderator", "admin"] } },
  { path: "/admin/orders", name: "admin-orders", component: () => import("../../pages/AdminOrdersPage.vue"), meta: { auth: true, roles: ["admin"] } },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const session = useSession();
  if (to.meta.auth && !session.isAuth) {
    return { name: "login", query: { next: to.fullPath } };
  }
  const roles = to.meta.roles as string[] | undefined;
  if (roles && session.user && !roles.includes(session.user.role)) {
    return { name: "catalog" };
  }
  return true;
});
