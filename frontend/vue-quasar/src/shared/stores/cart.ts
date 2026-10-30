// Корзина: гостевая (X-Cart-Token) или аккаунтная — обе через единый /cart API.
import { defineStore } from "pinia";
import { api, call, errorMessage } from "../api/client";
import { useSession } from "./session";

export interface CartItemView {
  id: string;
  quantity: number;
  lineTotal: number;
  product: {
    id: string;
    title: string;
    price: number;
    image: string | null;
  };
}

export interface CartView {
  id: string;
  items: CartItemView[];
  subtotal: number;
}

type RawCart = {
  id: string;
  subtotal?: number;
  items: Array<{
    id: string;
    quantity?: number;
    lineTotal?: number;
    product: { id: string; title: string; price: number; images?: Array<{ url: string; isPrimary?: boolean }> };
  }>;
};

function toView(body: RawCart): CartView {
  return {
    id: body.id,
    subtotal: body.subtotal ?? 0,
    items: body.items.map((item) => ({
      id: item.id,
      quantity: item.quantity ?? 0,
      lineTotal: item.lineTotal ?? 0,
      product: {
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        image: item.product.images?.find((i) => i.isPrimary)?.url ?? item.product.images?.[0]?.url ?? null,
      },
    })),
  };
}

export const useCart = defineStore("cart", {
  state: () => ({
    cart: null as CartView | null,
    loading: false,
  }),
  getters: {
    count: (s) => s.cart?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0,
    subtotal: (s) => s.cart?.subtotal ?? 0,
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.cart = toView(await call(api.cart.getCart()));
      } finally {
        this.loading = false;
      }
    },
    async add(productId: string, quantity = 1): Promise<string | null> {
      const session = useSession();
      try {
        const res = await api.cart.addCartItem({ productId, quantity });
        session.noteCartToken(res.headers?.["x-cart-token"]);
        this.cart = toView(res.data);
        return null;
      } catch (err) {
        return errorMessage(err);
      }
    },
    async setQuantity(itemId: string, quantity: number) {
      this.cart = toView(await call(api.cart.updateCartItem(itemId, { quantity })));
    },
    async remove(itemId: string) {
      this.cart = toView(await call(api.cart.deleteCartItem(itemId)));
    },
    async reload() {
      await this.load();
    },
  },
});

export { errorMessage };
