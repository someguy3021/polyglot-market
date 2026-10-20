<script setup lang="ts">
const api = useApi();
const orders = ref<Array<any>>([]);
const loaded = ref(false);

onMounted(async () => {
  const res = await api.orders.listMyOrders(1, 20);
  orders.value = res.data.data;
  loaded.value = true;
});

const labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };
const colors: Record<string, string> = { new: "#1565c0", paid: "#b26a00", shipped: "#6a1b9a", done: "#2e7d32", cancelled: "#c62828" };
</script>

<template>
  <div>
    <h1>Мои заказы</h1>
    <div v-for="o in orders" :key="o.id" class="card">
      <div class="head">
        <span>Заказ #{{ o.id.slice(0, 8) }}… <span class="chip" :style="{ background: colors[o.status] }">{{ labels[o.status] ?? o.status }}</span></span>
        <strong>${{ Number(o.total).toFixed(2) }}</strong>
      </div>
      <div class="meta">{{ new Date(o.createdAt).toLocaleString("ru") }} · {{ o.shippingMethod.name }}</div>
      <div v-for="i in o.items" :key="i.id" class="item">{{ i.title }} × {{ i.quantity }} — ${{ Number(i.price).toFixed(2) }}</div>
    </div>
    <p v-if="loaded && orders.length === 0">Заказов пока нет. <NuxtLink to="/">К каталогу</NuxtLink></p>
  </div>
</template>

<style scoped>
.card { background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; }
.head { display: flex; justify-content: space-between; align-items: center; }
.chip { color: #fff; border-radius: 12px; padding: 2px 10px; font-size: 12px; }
.meta { color: #777; font-size: 12px; margin: 4px 0; }
.item { font-size: 14px; }
</style>
