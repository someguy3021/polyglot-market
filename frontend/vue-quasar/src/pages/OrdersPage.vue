<template>
  <q-page padding class="container">
    <div class="text-h5 q-mb-md">Мои заказы</div>

    <q-card v-for="order in orders" :key="order.id" flat bordered class="q-mb-md q-pa-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-subtitle1">Заказ #{{ order.id.slice(0, 8) }}…
            <q-badge :color="statusColor(order.status)" class="q-ml-sm">{{ statusLabel(order.status) }}</q-badge>
          </div>
          <div class="text-caption text-grey-7">{{ new Date(order.createdAt).toLocaleString("ru") }} · {{ order.shippingMethod.name }}</div>
        </div>
        <div class="text-h6">${{ order.total.toFixed(2) }}</div>
      </div>
      <q-separator class="q-my-sm" />
      <div v-for="item in order.items" :key="item.id" class="text-body2">
        {{ item.title }} × {{ item.quantity }} — ${{ item.price.toFixed(2) }}
      </div>
    </q-card>

    <q-banner v-if="loaded && orders.length === 0" class="bg-grey-2">
      Заказов пока нет. <router-link to="/">К каталогу</router-link>
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { api, call, errorMessage } from "../shared/api/client";

interface OrderView {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  shippingMethod: { name: string };
  items: Array<{ id: string; title: string; quantity: number; price: number }>;
}

const $q = useQuasar();
const orders = ref<OrderView[]>([]);
const loaded = ref(false);

const labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };
const colors: Record<string, string> = { new: "blue-8", paid: "amber-8", shipped: "purple-8", done: "green-8", cancelled: "red-8" };
const statusLabel = (s: string) => labels[s] ?? s;
const statusColor = (s: string) => colors[s] ?? "grey-6";

onMounted(async () => {
  try {
    const body = await call(api.orders.listMyOrders(1, 20));
    orders.value = body.data as OrderView[];
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  } finally {
    loaded.value = true;
  }
});
</script>

<style scoped>
.container { max-width: 900px; margin: 0 auto; }
</style>
