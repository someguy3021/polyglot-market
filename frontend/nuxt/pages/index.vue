<script setup lang="ts">
const api = useApi();
const user = useSession();
const cart = useCart();

const q = ref("");
const category = ref("");
const sort = ref("newest");

const { data } = await useAsyncData(
  "catalog",
  async () => {
    const res = await api.catalog.listProducts(
      1, 20,
      category.value || undefined, undefined,
      q.value || undefined,
      undefined, undefined,
      sort.value as never,
    );
    return res.data; // plain POJO для payload (AxiosResponse несериализуем)
  },
  { watch: [q, category, sort] },
);

const { data: cats } = await useAsyncData("categories", async () => (await api.catalog.listCategories()).data);

const products = computed(() => (data.value?.data ?? []) as any[]);
const lastPage = computed(() => data.value?.meta?.lastPage ?? 1);

async function add(p: any) {
  const error = await addToCart(p.id, 1);
  alert(error || "Добавлено в корзину");
}

const image = (p: any) => {
  const primary = (p.images || []).find((i: any) => i.isPrimary) || (p.images || [])[0];
  return primary ? primary.url : "";
};
</script>

<template>
  <div>
    <div class="filters">
      <input v-model="q" placeholder="Поиск по названию" @input="() => {}" />
      <select v-model="category">
        <option value="">Все категории</option>
        <option v-for="c in cats?.data?.data ?? []" :key="c.id" :value="c.slug">{{ c.name }}</option>
      </select>
      <select v-model="sort">
        <option value="newest">Сначала новые</option>
        <option value="oldest">Сначала старые</option>
        <option value="price_asc">Дешевле</option>
        <option value="price_desc">Дороже</option>
      </select>
    </div>

    <div class="grid">
      <div v-for="p in products" :key="p.id" class="card" @click="navigateTo(`/product/${p.id}`)">
        <img :src="image(p)" :alt="p.title" />
        <div class="body">
          <div class="title">{{ p.title }}</div>
          <div class="meta">{{ p.category.name }} · {{ p.seller.shopName }}</div>
          <div class="price">${{ Number(p.price).toFixed(2) }}</div>
        </div>
        <div class="actions">
          <span class="stock" :class="{ out: p.stock <= 0 }">{{ p.stock > 0 ? `в наличии: ${p.stock}` : "нет" }}</span>
          <button class="primary" :disabled="p.stock <= 0" @click.stop="add(p)">В корзину</button>
        </div>
      </div>
    </div>
    <p v-if="products.length === 0" class="grey">Ничего не найдено — смягчите фильтры.</p>
    <p v-if="lastPage > 1" class="grey">Страница 1 из {{ lastPage }} (пагинация — на флагмане)</p>
  </div>
</template>

<style scoped>
.filters { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
.filters input { flex: 1 1 260px; }
.grey { color: #888; }
</style>
