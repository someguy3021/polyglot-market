<template>
  <q-page padding class="container">
    <div class="row q-col-gutter-md q-mb-md items-end">
      <div class="col-12 col-md-4">
        <q-input v-model="filters.q" dense outlined debounce="350" label="Поиск по названию" clearable @update:model-value="load(1)" />
      </div>
      <div class="col-6 col-md-3">
        <q-select v-model="filters.category" :options="categoryOptions" dense outlined label="Категория" emit-value map-options clearable @update:model-value="load(1)" />
      </div>
      <div class="col-3 col-md-2">
        <q-input v-model.number="filters.priceMin" dense outlined type="number" label="Цена от" @update:model-value="load(1)" />
      </div>
      <div class="col-3 col-md-2">
        <q-input v-model.number="filters.priceMax" dense outlined type="number" label="до" @update:model-value="load(1)" />
      </div>
      <div class="col-12 col-md-1">
        <q-select v-model="filters.sort" :options="sortOptions" dense outlined emit-value map-options @update:model-value="load(1)" />
      </div>
    </div>

    <div v-if="loading" class="row q-gutter-md">
      <q-card v-for="n in 8" :key="n" flat bordered style="width: 260px; height: 320px">
        <q-skeleton square style="width: 100%; height: 180px" />
        <q-card-section><q-skeleton type="text" width="80%" /><q-skeleton type="text" width="40%" /></q-card-section>
      </q-card>
    </div>

    <div v-else class="row q-gutter-md">
      <q-card
        v-for="product in products"
        :key="product.id"
        flat bordered
        class="product-card cursor-pointer"
        style="width: 260px"
        @click="router.push(`/product/${product.id}`)"
      >
        <img :src="primaryImage(product)" style="width: 100%; height: 180px; object-fit: cover" />
        <q-card-section>
          <div class="text-subtitle2 ellipsis-2-lines" style="min-height: 40px">{{ product.title }}</div>
          <div class="text-caption text-grey-7">{{ product.category.name }} · {{ product.seller.shopName }}</div>
          <div class="text-h6 q-mt-xs">${{ product.price.toFixed(2) }}</div>
        </q-card-section>
        <q-card-actions align="between">
          <q-badge :color="product.stock > 0 ? 'green-8' : 'grey-6'">
            {{ product.stock > 0 ? `в наличии: ${product.stock}` : "нет в наличии" }}
          </q-badge>
          <q-btn
            color="primary"
            dense
            label="В корзину"
            icon="add_shopping_cart"
            :disable="product.stock <= 0"
            @click.stop="addToCart(product.id)"
          />
        </q-card-actions>
      </q-card>

      <div v-if="!loading && products.length === 0" class="text-grey-7 q-pa-xl">
        Ничего не найдено — смягчите фильтры.
      </div>
    </div>

    <div class="row justify-center q-mt-lg" v-if="lastPage > 1">
      <q-pagination v-model="page" :max="lastPage" direction-links @update:model-value="load()" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api, call, errorMessage } from "../api/client";
import { useCart } from "../stores/cart";

interface ProductCard {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: { name: string };
  seller: { shopName: string };
  images: Array<{ url: string; isPrimary: boolean }>;
}

const router = useRouter();
const $q = useQuasar();
const cart = useCart();

const products = ref<ProductCard[]>([]);
const loading = ref(true);
const page = ref(1);
const lastPage = ref(1);
const categoryOptions = ref<Array<{ label: string; value: string }>>([]);

const filters = reactive({
  q: "",
  category: null as string | null,
  priceMin: undefined as number | undefined,
  priceMax: undefined as number | undefined,
  sort: "newest",
});

const sortOptions = [
  { label: "Сначала новые", value: "newest" },
  { label: "Сначала старые", value: "oldest" },
  { label: "Дешевле", value: "price_asc" },
  { label: "Дороже", value: "price_desc" },
];

function primaryImage(p: ProductCard): string {
  return p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? "";
}

async function load(targetPage?: number) {
  loading.value = true;
  try {
    if (targetPage) page.value = targetPage;
    const body = await call(
      api.catalog.listProducts(
        page.value,
        20,
        filters.category ?? undefined,
        undefined,
        filters.q || undefined,
        filters.priceMin,
        filters.priceMax,
        filters.sort as "newest" | "oldest" | "price_asc" | "price_desc",
      ),
    );
    products.value = body.data as ProductCard[];
    lastPage.value = body.meta.lastPage;
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  } finally {
    loading.value = false;
  }
}

async function addToCart(productId: string) {
  const error = await cart.add(productId, 1);
  if (error) {
    $q.notify({ type: "negative", message: error });
  } else {
    $q.notify({ type: "positive", message: "Добавлено в корзину", timeout: 900 });
  }
}

onMounted(async () => {
  await load();
  try {
    const body = await call(api.catalog.listCategories());
    categoryOptions.value = body.data.map((c) => ({ label: c.name, value: c.slug }));
  } catch {
    /* фильтр категорий необязателен */
  }
});
</script>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; }
</style>
