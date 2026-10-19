<template>
  <q-page padding class="container">
    <div class="text-h5 q-mb-md">Очередь модерации</div>

    <q-table
      flat bordered
      :rows="queue"
      :columns="columns"
      row-key="id"
      :loading="loading"
      no-data-label="Очередь пуста — всё промодерировано"
    >
      <template #body-cell-seller="props">
        <q-td :props="props">{{ props.row.seller.shopName }}</q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-no-wrap">
          <q-btn dense color="green-8" label="Одобрить" class="q-mr-sm" @click="approve(props.row.id)" />
          <q-btn dense color="red-8" label="Отклонить" @click="rejectOpen = props.row.id" />
        </q-td>
      </template>
    </q-table>

    <q-dialog :model-value="rejectOpen !== null" persistent @update:model-value="rejectOpen = null">
      <q-card style="min-width: 420px">
        <q-card-section>
          <div class="text-h6">Причина отклонения</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="rejectReason" outlined type="textarea" label="Что исправить продавцу" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" @click="rejectOpen = null" />
          <q-btn color="red-8" label="Отклонить" @click="reject" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { api, call, errorMessage } from "../api/client";

interface QueueItem {
  id: string;
  title: string;
  price: number;
  seller: { shopName: string };
}

const $q = useQuasar();
const queue = ref<QueueItem[]>([]);
const loading = ref(true);
const rejectOpen = ref<string | null>(null);
const rejectReason = ref("");

const columns = [
  { name: "title", label: "Товар", field: "title", align: "left" as const },
  { name: "price", label: "Цена", field: "price", format: (v: number) => `$${Number(v).toFixed(2)}` },
  { name: "seller", label: "Продавец", field: "seller", align: "left" as const },
  { name: "actions", label: "Решение", field: () => "", align: "left" as const },
];

async function load() {
  loading.value = true;
  try {
    const body = await call(api.moderation.moderationQueue(1, 50));
    queue.value = body.data as QueueItem[];
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  } finally {
    loading.value = false;
  }
}

async function approve(id: string) {
  try {
    await api.moderation.approveProduct(id);
    $q.notify({ type: "positive", message: "Товар в продаже" });
    await load();
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  }
}

async function reject() {
  if (!rejectOpen.value) return;
  try {
    await api.moderation.rejectProduct(rejectOpen.value, { reason: rejectReason.value });
    rejectOpen.value = null;
    rejectReason.value = "";
    $q.notify({ type: "positive", message: "Отклонено — продавец увидит причину" });
    await load();
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  }
}

onMounted(load);
</script>

<style scoped>
.container { max-width: 1000px; margin: 0 auto; }
</style>
