<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 16px">
    <v-row dense>
      <v-col cols="12" md="4"><v-text-field v-model="q" dense outlined label="Поиск по названию" @input="load(1)" /></v-col>
      <v-col cols="6" md="3">
        <v-select v-model="category" dense outlined :items="categoryOptions" label="Категория" @change="load(1)" />
      </v-col>
      <v-col cols="3" md="2"><v-text-field v-model="priceMin" dense outlined type="number" label="Цена от" @input="load(1)" /></v-col>
      <v-col cols="3" md="2"><v-text-field v-model="priceMax" dense outlined type="number" label="до" @input="load(1)" /></v-col>
      <v-col cols="12" md="1">
        <v-select v-model="sort" dense outlined :items="sortOptions" @change="load(1)" />
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="p in products" :key="p.id" cols="6" md="3">
        <v-card @click="$router.push(`/product/${p.id}`)" class="cursor-pointer" height="100%">
          <v-img :src="image(p)" height="180" />
          <v-card-text>
            <div style="min-height: 40px">{{ p.title }}</div>
            <div class="text-caption grey--text">{{ p.category.name }} · {{ p.seller.shopName }}</div>
            <div class="text-h6">${{ Number(p.price).toFixed(2) }}</div>
          </v-card-text>
          <v-card-actions>
            <v-chip small :color="p.stock > 0 ? 'green' : 'grey'">
              {{ p.stock > 0 ? `в наличии: ${p.stock}` : "нет" }}
            </v-chip>
            <v-spacer />
            <v-btn small color="primary" :disabled="p.stock <= 0" @click.stop="add(p.id)">
              <v-icon small left>mdi-cart-plus</v-icon> В корзину
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <div v-if="products.length === 0" class="grey--text pa-8">Ничего не найдено — смягчите фильтры.</div>

    <div class="text-center mt-4" v-if="lastPage > 1">
      <v-pagination v-model="page" :length="lastPage" @input="load()" />
    </div>
  </div>
</template>

<script>
import { api } from "../shared/api";

export default {
  name: "CatalogPage",
  data: () => ({
    products: [],
    page: 1,
    lastPage: 1,
    q: "",
    category: "",
    priceMin: "",
    priceMax: "",
    sort: "newest",
    categoryOptions: [{ text: "Все", value: "" }],
    sortOptions: [
      { text: "Сначала новые", value: "newest" },
      { text: "Сначала старые", value: "oldest" },
      { text: "Дешевле", value: "price_asc" },
      { text: "Дороже", value: "price_desc" },
    ],
  }),
  async mounted() {
    await this.load();
    try {
      const res = await api.catalog.listCategories();
      this.categoryOptions = [{ text: "Все", value: "" }, ...res.data.data.map((c) => ({ text: c.name, value: c.slug }))];
    } catch {
      /* фильтр необязателен */
    }
  },
  methods: {
    image(p) {
      const primary = (p.images || []).find((i) => i.isPrimary) || (p.images || [])[0];
      return primary ? primary.url : "";
    },
    async load(targetPage) {
      if (targetPage) this.page = targetPage;
      const res = await api.catalog.listProducts(
        this.page, 20,
        this.category || undefined, undefined,
        this.q || undefined,
        this.priceMin ? Number(this.priceMin) : undefined,
        this.priceMax ? Number(this.priceMax) : undefined,
        this.sort,
      );
      this.products = res.data.data;
      this.lastPage = res.data.meta.lastPage;
    },
    async add(productId) {
      const error = await this.$store.dispatch("addToCart", { productId, quantity: 1 });
      if (error) this.$store.commit("setError", error);
      else this.snackbar = true;
    },
  },
};
</script>
