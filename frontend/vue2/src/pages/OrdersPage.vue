<template>
  <div style="max-width: 900px; margin: 0 auto; padding: 16px">
    <div class="text-h5 mb-4">Мои заказы</div>
    <v-card v-for="o in orders" :key="o.id" class="pa-4 mb-3">
      <div class="d-flex justify-space-between align-center">
        <div>
          <div class="text-subtitle-1">
            Заказ #{{ o.id.slice(0, 8) }}…
            <v-chip small class="ml-2" :color="colors[o.status]">{{ labels[o.status] || o.status }}</v-chip>
          </div>
          <div class="text-caption grey--text">
            {{ new Date(o.createdAt).toLocaleString("ru") }} · {{ o.shippingMethod.name }}
          </div>
        </div>
        <div class="text-h6">${{ Number(o.total).toFixed(2) }}</div>
      </div>
      <v-divider class="my-2" />
      <div v-for="i in o.items" :key="i.id" class="text-body-2">
        {{ i.title }} × {{ i.quantity }} — ${{ Number(i.price).toFixed(2) }}
      </div>
    </v-card>
    <v-alert v-if="loaded && !orders.length" type="info">Заказов пока нет. <router-link to="/">К каталогу</router-link></v-alert>
  </div>
</template>

<script>
import { api } from "../api";

export default {
  name: "OrdersPage",
  data: () => ({ orders: [], loaded: false }),
  computed: {
    labels: () => ({ new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" }),
    colors: () => ({ new: "blue", paid: "amber", shipped: "purple", done: "green", cancelled: "red" }),
  },
  async mounted() {
    const res = await api.orders.listMyOrders(1, 20);
    this.orders = res.data.data;
    this.loaded = true;
  },
};
</script>
