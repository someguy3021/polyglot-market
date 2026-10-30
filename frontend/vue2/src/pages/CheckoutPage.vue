<template>
  <div style="max-width: 900px; margin: 0 auto; padding: 16px">
    <div class="text-h5 mb-4">Оформление заказа</div>
    <v-alert v-if="!items.length" type="info">Корзина пуста. <router-link to="/">К каталогу</router-link></v-alert>
    <v-card v-else class="pa-6">
      <div class="text-subtitle-1 mb-2">1. Доставка</div>
      <v-radio-group v-model="method">
        <v-radio v-for="m in shipping" :key="m.code" :value="m.code"
          :label="`${m.name} — $${Number(m.price).toFixed(2)} · ${m.etaDays} дн.`" />
      </v-radio-group>

      <div class="text-subtitle-1 mb-2">2. Промокод</div>
      <div class="d-flex align-center mb-4">
        <v-text-field v-model="promoCode" dense outlined label="Промокод (например WELCOME10)" style="max-width: 320px" class="mr-2" />
        <v-btn text @click="checkPromo">Проверить</v-btn>
        <v-chip v-if="promo" color="green" dark>скидка ${{ Number(promo.discount).toFixed(2) }}</v-chip>
      </div>

      <div class="text-subtitle-1 mb-2">3. Адрес</div>
      <v-row>
        <v-col cols="12" md="6"><v-text-field v-model="address.line1" dense outlined label="Улица, дом" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="address.line2" dense outlined label="Квартира (опц.)" /></v-col>
        <v-col cols="6" md="4"><v-text-field v-model="address.city" dense outlined label="Город" /></v-col>
        <v-col cols="6" md="4"><v-text-field v-model="address.zip" dense outlined label="Индекс" /></v-col>
        <v-col cols="6" md="4"><v-text-field v-model="address.country" dense outlined label="Страна (US)" /></v-col>
      </v-row>

      <v-divider class="my-4" />
      <div class="d-flex justify-end align-center">
        <div class="grey--text mr-4">
          Товары: ${{ Number(subtotal).toFixed(2) }}
          <template v-if="promo"> · скидка: −${{ Number(promo.discount).toFixed(2) }}</template>
          · доставка: ${{ Number(shippingPrice).toFixed(2) }}
        </div>
        <div class="text-h6 mr-4">К оплате: ${{ total.toFixed(2) }}</div>
        <v-btn color="primary" x-large :disabled="!canPlace" :loading="placing" @click="place">Подтвердить заказ</v-btn>
      </div>
    </v-card>
  </div>
</template>

<script>
import { api, setOrderIdempotencyKey } from "../shared/api";

export default {
  name: "CheckoutPage",
  data: () => ({
    shipping: [],
    method: "",
    promoCode: "",
    promo: null,
    placing: false,
    address: { line1: "", line2: "", city: "", zip: "", country: "US" },
  }),
  computed: {
    items() {
      return this.$store.state.cart ? this.$store.state.cart.items : [];
    },
    subtotal() {
      return this.$store.state.cart ? this.$store.state.cart.subtotal : 0;
    },
    shippingPrice() {
      const m = this.shipping.find((s) => s.code === this.method);
      return m ? Number(m.price) : 0;
    },
    total() {
      return Math.max(0, this.subtotal - (this.promo ? Number(this.promo.discount) : 0)) + this.shippingPrice;
    },
    canPlace() {
      return this.items.length > 0 && this.method !== "" && this.address.line1 && this.address.city && this.address.zip;
    },
  },
  async mounted() {
    this.$store.dispatch("loadCart");
    const methods = await (await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/shipping-methods`)).json();
    this.shipping = methods.data;
    if (this.shipping.length) this.method = this.shipping[0].code;
  },
  methods: {
    async checkPromo() {
      const res = await api.orders.validatePromo({ code: this.promoCode, subtotal: this.subtotal });
      this.promo = res.data;
    },
    async place() {
      this.placing = true;
      const key = crypto.randomUUID();
      setOrderIdempotencyKey(key);
      try {
        await api.orders.createOrder(key, {
          shippingMethodCode: this.method,
          promoCode: this.promo ? this.promoCode : undefined,
          shippingAddress: {
            line1: this.address.line1,
            line2: this.address.line2 || undefined,
            city: this.address.city,
            zip: this.address.zip,
            country: this.address.country.toUpperCase(),
          },
        });
        setOrderIdempotencyKey(undefined);
        await this.$store.dispatch("loadCart");
        this.$router.push("/orders");
      } catch (err) {
        setOrderIdempotencyKey(undefined);
        this.$store.commit("setError", err.response?.data?.message || "Ошибка оформления");
      } finally {
        this.placing = false;
      }
    },
  },
};
</script>
