<template>
  <div style="max-width: 1100px; margin: 0 auto; padding: 16px">
    <div class="text-h5 mb-4">Админ — заказы</div>
    <v-select v-model="status" dense outlined :items="statusOptions" label="Статус" clearable style="max-width: 240px" class="mb-4" @change="load" />
    <v-simple-table>
      <thead><tr><th>Заказ</th><th>Позиции</th><th>Сумма</th><th>Создан</th><th>Статус →</th></tr></thead>
      <tbody>
        <tr v-for="o in orders" :key="o.id">
          <td>#{{ o.id.slice(0, 8) }}…</td>
          <td><div v-for="i in o.items" :key="i.id" class="text-caption">{{ i.title }} × {{ i.quantity }}</div></td>
          <td>${{ Number(o.total).toFixed(2) }}</td>
          <td>{{ new Date(o.createdAt).toLocaleString("ru") }}</td>
          <td>
            <v-select :value="o.status" dense outlined :items="transitionsFor(o.status)" style="max-width: 160px" @change="changeStatus(o.id, $event)" />
          </td>
        </tr>
      </tbody>
    </v-simple-table>
  </div>
</template>

<script>
import { api } from "../shared/api";

const TRANSITIONS = {
  new: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["done"],
  done: [],
  cancelled: [],
};
const labels = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };

export default {
  name: "AdminOrdersPage",
  data: () => ({ orders: [], status: "" }),
  computed: {
    statusOptions() {
      return [{ text: "Все статусы", value: "" }, ...Object.entries(labels).map(([value, text]) => ({ text, value }))];
    },
  },
  async mounted() {
    await this.load();
  },
  methods: {
    transitionsFor(status) {
      return [status, ...(TRANSITIONS[status] || [])].map((value) => ({ text: labels[value] || value, value }));
    },
    async load() {
      const res = await api.admin.listAllOrders(1, 50, this.status || undefined);
      this.orders = res.data.data;
    },
    async changeStatus(id, status) {
      await api.admin.updateOrderStatus(id, { status });
      await this.load();
    },
  },
};
</script>
