<template>
  <div style="max-width: 1100px; margin: 0 auto; padding: 16px">
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h5">Мои товары</div>
      <v-btn color="primary" @click="createOpen = true"><v-icon left>mdi-plus</v-icon> Новый товар</v-btn>
    </div>
    <div v-if="error" class="red--text mb-2">{{ error }}</div>
    <v-simple-table>
      <thead>
        <tr><th>Товар</th><th>Цена</th><th>Остаток</th><th>Статус</th><th>Действия</th></tr>
      </thead>
      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td>{{ p.title }}</td>
          <td>${{ Number(p.price).toFixed(2) }}</td>
          <td>{{ p.stock }}</td>
          <td>
            <v-chip small :color="colors[p.status]">{{ labels[p.status] || p.status }}</v-chip>
            <div v-if="p.rejectionReason" class="text-caption red--text">{{ p.rejectionReason }}</div>
          </td>
          <td>
            <v-btn v-if="['draft', 'rejected'].includes(p.status)" small color="primary" class="mr-2" @click="submit(p.id)">
              На модерацию
            </v-btn>
            <input
              v-if="['draft', 'approved'].includes(p.status)"
              type="file" accept="image/png,image/jpeg,image/webp"
              @change="upload(p.id, $event.target.files[0])"
            />
          </td>
        </tr>
      </tbody>
    </v-simple-table>

    <v-dialog v-model="createOpen" max-width="480">
      <v-card>
        <v-card-title>Новый товар</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.title" outlined dense label="Название" class="mb-2" />
          <v-text-field v-model="form.description" outlined dense label="Описание" class="mb-2" />
          <div class="d-flex">
            <v-text-field v-model="form.price" outlined dense type="number" label="Цена $" class="mr-2" />
            <v-text-field v-model="form.stock" outlined dense type="number" label="Остаток" class="mr-2" />
            <v-select v-model="form.categoryId" outlined dense :items="categories" label="Категория" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="createOpen = false">Отмена</v-btn>
          <v-btn color="primary" @click="create">Создать черновик</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { api, errorMessage } from "../shared/api";

export default {
  name: "SellerProductsPage",
  data: () => ({
    products: [],
    categories: [],
    createOpen: false,
    error: "",
    form: { title: "", description: "", price: 0, stock: 0, categoryId: "" },
    labels: { draft: "черновик", pending_moderation: "на модерации", approved: "в продаже", rejected: "отклонён" },
    colors: { draft: "grey", pending_moderation: "amber", approved: "green", rejected: "red" },
  }),
  async mounted() {
    await this.load();
    const cats = await api.catalog.listCategories();
    this.categories = cats.data.data.map((c) => ({ text: c.name, value: c.id }));
  },
  methods: {
    async load() {
      const res = await api.seller.listSellerProducts(1, 50);
      this.products = res.data.data;
    },
    async create() {
      try {
        await api.seller.createSellerProduct({
          title: this.form.title,
          description: this.form.description || "",
          price: Number(this.form.price),
          stock: Number(this.form.stock),
          categoryId: this.form.categoryId,
        });
        this.createOpen = false;
        this.form = { title: "", description: "", price: 0, stock: 0, categoryId: "" };
        await this.load();
      } catch (err) {
        this.error = errorMessage(err);
      }
    },
    async submit(id) {
      try {
        await api.seller.submitSellerProduct(id);
        await this.load();
      } catch (err) {
        this.error = errorMessage(err);
      }
    },
    async upload(productId, file) {
      if (!file) return;
      try {
        await api.seller.uploadProductImage(productId, file);
        await this.load();
      } catch (err) {
        this.error = errorMessage(err);
      }
    },
  },
};
</script>
