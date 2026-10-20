<script setup lang="ts">
const api = useApi();
const products = ref<Array<any>>([]);
const error = ref("");

async function load() {
  const res = await api.seller.listSellerProducts(1, 50);
  products.value = res.data.data;
}

async function submit(id: string) {
  try {
    await api.seller.submitSellerProduct(id);
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function upload(id: string, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    await api.seller.uploadProductImage(id, file);
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

const labels: Record<string, string> = { draft: "черновик", pending_moderation: "на модерации", approved: "в продаже", rejected: "отклонён" };

onMounted(load);
</script>

<template>
  <div class="wrap">
    <h1>Мои товары</h1>
    <div v-if="error" class="error">{{ error }}</div>
    <table>
      <thead><tr><th>Товар</th><th>Цена</th><th>Остаток</th><th>Статус</th><th>Действия</th></tr></thead>
      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td>{{ p.title }}</td>
          <td>${{ Number(p.price).toFixed(2) }}</td>
          <td>{{ p.stock }}</td>
          <td>{{ labels[p.status] ?? p.status }}<div v-if="p.rejectionReason" class="error">{{ p.rejectionReason }}</div></td>
          <td>
            <button v-if="['draft', 'rejected'].includes(p.status)" class="primary" @click="submit(p.id)">На модерацию</button>
            <input v-if="['draft', 'approved'].includes(p.status)" type="file" accept="image/png,image/jpeg,image/webp" @change="upload(p.id, $event)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.wrap { max-width: 1000px; margin: 0 auto; }
table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd; border-radius: 8px; }
th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
.error { color: #c62828; font-size: 12px; }
</style>
