<template>
  <q-page padding class="container">
    <div class="text-h5 q-mb-md">Админ — заказы</div>

    <q-select
      v-model="statusFilter"
      :options="statusOptions"
      dense outlined emit-value map-options
      label="Статус"
      style="max-width: 240px"
      class="q-mb-md"
      clearable
      @update:model-value="load"
    />

    <q-table
      flat bordered
      :rows="orders"
      :columns="columns"
      row-key="id"
      :loading="loading"
      no-data-label="Заказов нет"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-select
            :model-value="props.row.status"
            :options="transitionsFor(props.row.status)"
            dense outlined emit-value map-options
            style="min-width: 160px"
            @update:model-value="(s: OrderStatus) => changeStatus(props.row.id, s)"
          />
        </q-td>
      </template>
      <template #body-cell-items="props">
        <q-td :props="props">
          <div v-for="item in props.row.items" :key="item.id" class="text-caption">
            {{ item.title }} × {{ item.quantity }}
          </div>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { api, call, errorMessage } from "../shared/api/client";

interface AdminOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ id: string; title: string; quantity: number }>;
}

const $q = useQuasar();
const orders = ref<AdminOrder[]>([]);
const loading = ref(true);
const statusFilter = ref<string | null>(null);

type OrderStatus = "new" | "paid" | "shipped" | "done" | "cancelled";

// Статусная машина заказа (контракт: PUT /admin/orders/{id}/status)
const TRANSITIONS: Record<string, OrderStatus[]> = {
  new: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["done"],
  done: [],
  cancelled: [],
};
const labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };
const statusOptions = Object.entries(labels).map(([value, label]) => ({ value, label }));
const transitionsFor = (status: string) => (TRANSITIONS[status] ?? []).map((value) => ({ value, label: labels[value] }));

const columns = [
  { name: "id", label: "Заказ", field: (r: AdminOrder) => `#${r.id.slice(0, 8)}…`, align: "left" as const },
  { name: "items", label: "Позиции", field: "items", align: "left" as const },
  { name: "total", label: "Сумма", field: "total", format: (v: number) => `$${Number(v).toFixed(2)}` },
  { name: "createdAt", label: "Создан", field: "createdAt", format: (v: string) => new Date(v).toLocaleString("ru") },
  { name: "status", label: "Статус → сменить", field: "status", align: "left" as const },
];

async function load() {
  loading.value = true;
  try {
    const body = await call(api.admin.listAllOrders(1, 50, (statusFilter.value ?? undefined) as never));
    orders.value = body.data as AdminOrder[];
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  } finally {
    loading.value = false;
  }
}

async function changeStatus(id: string, status: OrderStatus) {
  try {
    await api.admin.updateOrderStatus(id, { status });
    $q.notify({ type: "positive", message: "Статус обновлён" });
    await load();
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
    await load();
  }
}

onMounted(load);
</script>

<style scoped>
.container { max-width: 1100px; margin: 0 auto; }
</style>
