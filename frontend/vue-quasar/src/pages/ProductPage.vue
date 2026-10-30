<template>
  <q-page padding class="container">
    <q-card v-if="product" flat bordered class="q-pa-lg">
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-5">
          <q-img :src="primaryImage" style="width: 100%; max-height: 420px" fit="contain" />
          <div class="row q-gutter-sm q-mt-sm">
            <q-img
              v-for="image in product.images"
              :key="image.id"
              :src="image.thumbUrl ?? image.url"
              style="width: 72px; height: 56px; border-radius: 6px; cursor: pointer"
              :class="{ 'outline-primary': image.url === primaryImage }"
              @click="currentImage = image.url"
            />
          </div>
        </div>
        <div class="col-12 col-md-7">
          <div class="text-h5">{{ product.title }}</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ product.category.name }} · продает {{ product.seller.shopName }}
          </div>
          <div class="text-h4 q-mt-md">${{ product.price.toFixed(2) }}</div>
          <p class="text-body2 q-mt-md">{{ product.description }}</p>
          <q-badge :color="product.stock > 0 ? 'green-8' : 'grey-6'">
            {{ product.stock > 0 ? `в наличии: ${product.stock}` : "нет в наличии" }}
          </q-badge>

          <div class="row items-center q-mt-lg q-gutter-sm">
            <q-input v-model.number="quantity" type="number" dense outlined style="width: 90px" :min="1" :max="product.stock" />
            <q-btn
              color="primary"
              label="Добавить в корзину"
              icon="add_shopping_cart"
              :disable="product.stock <= 0"
              @click="addToCart"
            />
            <q-btn flat label="Перейти в корзину" to="/cart" />
          </div>
        </div>
      </div>
    </q-card>
    <q-inner-loading :showing="!product" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { api, call, errorMessage } from "../shared/api/client";
import { useCart } from "../shared/stores/cart";

interface ProductView {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: { name: string };
  seller: { shopName: string };
  images: Array<{ id: string; url: string; thumbUrl: string | null; isPrimary: boolean }>;
}

const route = useRoute();
const $q = useQuasar();
const cart = useCart();

const product = ref<ProductView | null>(null);
const currentImage = ref("");
const quantity = ref(1);

const primaryImage = computed(
  () => currentImage.value || product.value?.images.find((i) => i.isPrimary)?.url || product.value?.images[0]?.url || "",
);

async function addToCart() {
  if (!product.value) return;
  const error = await cart.add(product.value.id, quantity.value);
  if (error) $q.notify({ type: "negative", message: error });
  else $q.notify({ type: "positive", message: "Добавлено в корзину", timeout: 900 });
}

onMounted(async () => {
  try {
    product.value = (await call(api.catalog.getProduct(route.params.id as string))) as ProductView;
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  }
});
</script>

<style scoped>
.container { max-width: 1100px; margin: 0 auto; }
.outline-primary { outline: 2px solid #1976d2; }
</style>
