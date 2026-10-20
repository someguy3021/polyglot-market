// Vuex-стор (канон Vue 2): сессия + корзина. Токены синхронизируются с localStorage —
// их читает SDK на каждом запросе (api.js).
import Vue from "vue";
import Vuex from "vuex";
import { api, errorMessage } from "./api";

Vue.use(Vuex);

const toView = (body) => ({
  id: body.id,
  subtotal: body.subtotal ?? 0,
  items: (body.items || []).map((i) => ({
    id: i.id,
    quantity: i.quantity ?? 0,
    lineTotal: i.lineTotal ?? 0,
    product: {
      id: i.product.id,
      title: i.product.title,
      price: i.product.price,
      image:
        (i.product.images || []).find((x) => x.isPrimary)?.url ||
        (i.product.images || [])[0]?.url ||
        null,
    },
  })),
});

function persist(state) {
  if (state.token) localStorage.setItem("pm.token", state.token);
  else localStorage.removeItem("pm.token");
  if (state.cartToken) localStorage.setItem("pm.cart", state.cartToken);
  else localStorage.removeItem("pm.cart");
  if (state.user) localStorage.setItem("pm.user", JSON.stringify(state.user));
  else localStorage.removeItem("pm.user");
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("pm.user") || "null");
  } catch {
    return null;
  }
}

export const store = new Vuex.Store({
  state: () => ({
    token: localStorage.getItem("pm.token") || "",
    cartToken: localStorage.getItem("pm.cart") || "",
    user: readUser(),
    cart: null,
    lastError: "",
  }),

  getters: {
    isAuth: (s) => Boolean(s.token && s.user),
    role: (s) => (s.user ? s.user.role : null),
    cartCount: (s) => (s.cart ? s.cart.items.reduce((acc, i) => acc + i.quantity, 0) : 0),
  },

  mutations: {
    setAuth(state, { token, user }) {
      state.token = token;
      state.user = user;
      persist(state);
    },
    setCartToken(state, token) {
      state.cartToken = token || "";
      persist(state);
    },
    setCart(state, cart) {
      state.cart = toView(cart);
    },
    setError(state, message) {
      state.lastError = message;
    },
    clearSession(state) {
      state.token = "";
      state.user = null;
      state.cartToken = "";
      state.cart = null;
      persist(state);
    },
  },

  actions: {
    async login({ commit, dispatch }, { email, password }) {
      const res = await api.auth.login({ email, password });
      commit("setAuth", { token: res.data.token, user: res.data.user });
      await dispatch("mergeGuestCart");
    },
    async register({ commit, dispatch }, { name, email, password }) {
      const res = await api.auth.register({ name, email, password });
      commit("setAuth", { token: res.data.token, user: res.data.user });
      await dispatch("mergeGuestCart");
    },
    async mergeGuestCart({ state, commit }) {
      if (!state.cartToken) return;
      try {
        await api.cart.mergeCart({ token: state.cartToken });
        commit("setCartToken", "");
      } catch {
        /* мердж не критичен */
      }
    },
    logout({ commit }) {
      commit("clearSession");
    },
    async loadCart({ commit }) {
      const res = await api.cart.getCart();
      commit("setCart", res.data);
    },
    async addToCart({ commit, state }, { productId, quantity }) {
      try {
        const res = await api.cart.addCartItem({ productId, quantity });
        const header = res.headers && (res.headers["x-cart-token"] || res.headers["X-Cart-Token"]);
        if (header && !state.token) commit("setCartToken", header);
        commit("setCart", res.data);
        return null;
      } catch (err) {
        return errorMessage(err);
      }
    },
    async setQuantity({ commit }, { itemId, quantity }) {
      const res = await api.cart.updateCartItem(itemId, { quantity });
      commit("setCart", res.data);
    },
    async removeItem({ commit }, itemId) {
      const res = await api.cart.deleteCartItem(itemId);
      commit("setCart", res.data);
    },
  },
});

export { errorMessage };
