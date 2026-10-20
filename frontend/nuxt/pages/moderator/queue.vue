<script setup lang="ts">
const api = useApi();
const queue = ref<Array<any>>([]);
const rejecting = ref<string | null>(null);
const reason = ref("");
const error = ref("");

async function load() {
  const res = await api.moderation.moderationQueue(1, 50);
  queue.value = res.data.data;
}

async function approve(id: string) {
  try {
    await api.moderation.approveProduct(id);
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function reject() {
  if (!rejecting.value) return;
  try {
    await api.moderation.rejectProduct(rejecting.value, { reason: reason.value });
    rejecting.value = null;
    reason.value = "";
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

onMounted(load);
</script>

<template>
  <div class="wrap">
    <h1>Очередь модерации</h1>
    <div v-if="error" class="error">{{ error }}</div>
    <table>
      <thead><tr><th>Товар</th><th>Цена</th><th>Продавец</th><th>Решение</th></tr></thead>
      <tbody>
        <tr v-for="p in queue" :key="p.id">
          <td>{{ p.title }}</td>
          <td>${{ Number(p.price).toFixed(2) }}</td>
          <td>{{ p.seller.shopName }}</td>
          <td>
            <button class="ok" @click="approve(p.id)">Одобрить</button>
            <button class="bad" @click="rejecting = p.id">Отклонить</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="rejecting" class="modal">
      <div class="box">
        <h3>Причина отклонения</h3>
        <textarea v-model="reason" placeholder="Что исправить продавцу"></textarea>
        <div class="row">
          <button @click="rejecting = null">Отмена</button>
          <button class="bad" @click="reject">Отклонить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap { max-width: 1000px; margin: 0 auto; }
table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd; border-radius: 8px; }
th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
button { border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
.ok { background: #2e7d32; color: #fff; margin-right: 6px; }
.bad { background: #c62828; color: #fff; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; }
.box { background: #fff; border-radius: 10px; padding: 20px; width: 420px; display: flex; flex-direction: column; gap: 10px; }
textarea { height: 110px; }
.row { display: flex; gap: 10px; justify-content: flex-end; }
.error { color: #c62828; font-size: 12px; }
</style>
