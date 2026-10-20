<script setup lang="ts">
const api = useApi();
const orders = ref<Array<any>>([]);
const error = ref("");

const transitions: Record<string, string[]> = {
  new: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["done"],
  done: [],
  cancelled: [],
};
const labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };

async function load() {
  const res = await api.admin.listAllOrders(1, 50);
  orders.value = res.data.data;
}

async function changeStatus(id: string, status: string) {
  try {
    await api.admin.updateOrderStatus(id, { status });
    await load();
  } catch (err) {
    error.value = errorMessage(err);
    await load();
  }
}

onMounted(load);
</script>

<template>
  <div class="wrap">
    <h1>Админ — заказы</h1>
    <div v-if="error" class="error">{{ error }}</div>
    <table>
      <thead><tr><th>Заказ</th><th>Позиции</th><th>Сумма</th><th>Статус →</th></tr></thead>
      <tbody>
        <tr v-for="o in orders" :key="o.id">
          <td>#{{ o.id.slice(0, 8) }}…</td>
          <td><div v-for="i in o.items" :key="i.id" class="item">{{ i.title }} × {{ i.quantity }}</div></td>
          <td>${{ Number(o.total).toFixed(2) }}</td>
          <td>
            <select :value="o.status" @change="changeStatus(o.id, ($event.target as HTMLSelectElement).value)">
              <option v-for="s in [o.status, ...(transitions[o.status] ?? [])]" :key="s" :value="s">
                {{ labels[s] ?? s }}
              </option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; }
table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd; border-radius: 8px; }
th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
.item { font-size: 13px; }
select { padding: 6px; }
.error { color: #c62828; }
</style>
