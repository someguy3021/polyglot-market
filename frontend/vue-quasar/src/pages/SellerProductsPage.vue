<template>
  <q-page padding class="container">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Мои товары</div>
      <q-btn color="primary" label="Новый товар" icon="add" @click="createOpen = true" />
    </div>

    <q-table
      flat bordered
      :rows="products"
      :columns="columns"
      row-key="id"
      :loading="loading"
      no-data-label="Товаров пока нет — создайте первый"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="statusColor(props.row.status)">{{ statusLabel(props.row.status) }}</q-badge>
          <div v-if="props.row.status === 'rejected'" class="text-caption text-red-8">
            {{ props.row.rejectionReason }}
          </div>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-no-wrap">
          <q-btn
            v-if="['draft', 'rejected'].includes(props.row.status)"
            dense color="primary" label="На модерацию"
            @click="submit(props.row.id)"
          />
          <q-file
            v-if="['draft', 'approved'].includes(props.row.status)"
            :model-value="null"
            dense outlined accept="image/png,image/jpeg,image/webp"
            label="картинка" style="max-width: 190px"
            @update:model-value="(f: File | null) => f && uploadImage(props.row.id, f)"
          />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="createOpen" persistent>
      <q-card style="min-width: 480px">
        <q-card-section>
          <div class="text-h6">Новый товар</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.title" outlined dense label="Название" />
          <q-input v-model="form.description" outlined dense type="textarea" label="Описание" />
          <div class="row q-gutter-sm">
            <q-input v-model.number="form.price" outlined dense type="number" label="Цена $" style="width: 140px" />
            <q-input v-model.number="form.stock" outlined dense type="number" label="Остаток" style="width: 140px" />
            <q-select v-model="form.categoryId" :options="categories" outlined dense emit-value map-options label="Категория" style="min-width: 200px" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Создать черновик" :loading="saving" @click="create" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import { api, call, errorMessage } from "../api/client";

interface SellerProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: string;
  rejectionReason: string | null;
}

const $q = useQuasar();
const products = ref<SellerProduct[]>([]);
const categories = ref<Array<{ label: string; value: string }>>([]);
const loading = ref(true);
const saving = ref(false);
const createOpen = ref(false);

const form = reactive({ title: "", description: "", price: 0, stock: 0, categoryId: "" });

const columns = [
  { name: "title", label: "Товар", field: "title", align: "left" as const },
  { name: "price", label: "Цена", field: "price", format: (v: number) => `$${Number(v).toFixed(2)}` },
  { name: "stock", label: "Остаток", field: "stock" },
  { name: "status", label: "Статус", field: "status", align: "left" as const },
  { name: "actions", label: "Действия", field: () => "", align: "left" as const },
];

const labels: Record<string, string> = { draft: "черновик", pending_moderation: "на модерации", approved: "в продаже", rejected: "отклонён" };
const colors: Record<string, string> = { draft: "grey-7", pending_moderation: "amber-8", approved: "green-8", rejected: "red-8" };
const statusLabel = (s: string) => labels[s] ?? s;
const statusColor = (s: string) => colors[s] ?? "grey-6";

async function load() {
  loading.value = true;
  try {
    const body = await call(api.seller.listSellerProducts(1, 50));
    products.value = body.data as SellerProduct[];
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  } finally {
    loading.value = false;
  }
}

async function create() {
  saving.value = true;
  try {
    await api.seller.createSellerProduct({
      title: form.title,
      description: form.description || "",
      price: form.price,
      stock: form.stock,
      categoryId: form.categoryId,
    });
    createOpen.value = false;
    form.title = ""; form.description = ""; form.price = 0; form.stock = 0;
    $q.notify({ type: "positive", message: "Черновик создан — отправьте на модерацию" });
    await load();
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  } finally {
    saving.value = false;
  }
}

async function submit(id: string) {
  try {
    await api.seller.submitSellerProduct(id);
    $q.notify({ type: "positive", message: "Отправлено на модерацию" });
    await load();
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  }
}

async function uploadImage(productId: string, file: File) {
  try {
    await api.seller.uploadProductImage(productId, file);
    $q.notify({ type: "positive", message: "Изображение загружено" });
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  }
}

onMounted(async () => {
  await load();
  try {
    const body = await call(api.catalog.listCategories());
    categories.value = body.data.map((c) => ({ label: c.name, value: c.id }));
  } catch {
    /* категории для формы */
  }
});
</script>

<style scoped>
.container { max-width: 1000px; margin: 0 auto; }
</style>
