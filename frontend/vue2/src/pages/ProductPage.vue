<template>
  <div style="max-width: 900px; margin: 0 auto; padding: 16px">
    <v-card v-if="!product" class="pa-8 grey--text">Загрузка…</v-card>
    <v-card v-else class="pa-6">
      <v-row>
        <v-col cols="12" md="5">
          <v-img :src="currentImage || primaryImage" max-height="420" contain />
          <div class="d-flex mt-2">
            <v-img
              v-for="img in product.images" :key="img.id"
              :src="img.thumbUrl || img.url" max-width="72" max-height="56"
              class="mr-2 rounded cursor-pointer"
              :style="img.url === (currentImage || primaryImage) ? 'outline: 2px solid #1976d2' : ''"
              @click="currentImage = img.url"
            />
          </div>
        </v-col>
        <v-col cols="12" md="7">
          <div class="text-h5">{{ product.title }}</div>
          <div class="text-caption grey--text">{{ product.category.name }} · продает {{ product.seller.shopName }}</div>
          <div class="text-h4 mt-4">${{ Number(product.price).toFixed(2) }}</div>
          <p class="mt-2">{{ product.description }}</p>
          <v-chip small :color="product.stock > 0 ? 'green' : 'grey'">
            {{ product.stock > 0 ? `в наличии: ${product.stock}` : "нет в наличии" }}
          </v-chip>
          <div class="d-flex align-center mt-6">
            <v-text-field v-model="qty" type="number" dense outlined style="max-width: 90px" class="mr-2" />
            <v-btn color="primary" :disabled="product.stock <= 0" @click="add">
              <v-icon left>mdi-cart-plus</v-icon> Добавить в корзину
            </v-btn>
            <v-btn text to="/cart">Перейти в корзину</v-btn>
          </div>
          <div v-if="error" class="red--text mt-2">{{ error }}</div>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import { api, errorMessage } from "../api";

export default {
  name: "ProductPage",
  data: () => ({ product: null, currentImage: "", qty: 1, error: "" }),
  computed: {
    primaryImage() {
      const imgs = (this.product && this.product.images) || [];
      const primary = imgs.find((i) => i.isPrimary) || imgs[0];
      return primary ? primary.url : "";
    },
  },
  async mounted() {
    const res = await api.catalog.getProduct(this.$route.params.id);
    this.product = res.data;
  },
  methods: {
    async add() {
      try {
        const error = await this.$store.dispatch("addToCart", { productId: this.product.id, quantity: Number(this.qty) });
        this.error = error || "";
      } catch (err) {
        this.error = errorMessage(err);
      }
    },
  },
};
</script>
