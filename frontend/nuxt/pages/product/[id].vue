<script setup lang="ts">
const api = useApi();
const route = useRoute();

const { data } = await useAsyncData(`product-${route.params.id}`, async () => (await api.catalog.getProduct(route.params.id as string)).data);
const product = computed(() => data.value?.data as any);

const qty = ref(1);
const error = ref("");

async function add() {
  error.value = (await addToCart(product.value.id, Number(qty.value))) ?? "";
  if (!error.value) navigateTo("/cart");
}

const primary = computed(() => {
  const imgs = product.value?.images ?? [];
  return imgs.find((i: any) => i.isPrimary)?.url ?? imgs[0]?.url ?? "";
});
</script>

<template>
  <div class="wrap">
    <div class="media">
      <img :src="primary" :alt="product?.title" />
    </div>
    <div class="info">
      <h1>{{ product?.title }}</h1>
      <p class="meta">{{ product?.category?.name }} · продает {{ product?.seller?.shopName }}</p>
      <p class="price">${{ Number(product?.price ?? 0).toFixed(2) }}</p>
      <p>{{ product?.description }}</p>
      <span class="stock" :class="{ out: (product?.stock ?? 0) <= 0 }">
        {{ (product?.stock ?? 0) > 0 ? `в наличии: ${product.stock}` : "нет в наличии" }}
      </span>
      <div class="buy">
        <input v-model="qty" type="number" min="1" style="max-width: 90px" />
        <button class="primary" :disabled="(product?.stock ?? 0) <= 0" @click="add">Добавить в корзину</button>
        <NuxtLink to="/cart">Перейти в корзину</NuxtLink>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<style scoped>
.wrap { display: flex; gap: 28px; flex-wrap: wrap; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 24px; }
.media { flex: 1 1 320px; }
.media img { max-height: 420px; object-fit: contain; }
.info { flex: 1 1 320px; }
.meta { color: #777; font-size: 13px; }
.price { font-size: 32px; font-weight: 700; }
.stock { font-size: 13px; color: #2e7d32; }
.stock.out { color: #999; }
.buy { display: flex; gap: 12px; align-items: center; margin-top: 24px; }
</style>
