<template>
  <div style="max-width: 900px; margin: 0 auto; padding: 16px">
    <div class="text-h5 mb-4">Корзина</div>
    <v-alert v-if="!items.length" type="info">Корзина пуста. <router-link to="/">К каталогу</router-link></v-alert>
    <v-list v-else>
      <v-list-item v-for="item in items" :key="item.id">
        <v-list-item-avatar size="72" rounded>
          <v-img :src="item.product.image || ''" />
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ item.product.title }}</v-list-item-title>
          <v-list-item-subtitle>
            ${{ Number(item.product.price).toFixed(2) }} × {{ item.quantity }} = ${{ Number(item.lineTotal).toFixed(2) }}
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action class="d-flex flex-row align-center">
          <v-btn icon @click="setQty(item, item.quantity - 1)"><v-icon>mdi-minus</v-icon></v-btn>
          <span class="mx-2">{{ item.quantity }}</span>
          <v-btn icon @click="setQty(item, item.quantity + 1)"><v-icon>mdi-plus</v-icon></v-btn>
          <v-btn icon color="red" @click="remove(item.id)"><v-icon>mdi-delete</v-icon></v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <div v-if="items.length" class="d-flex justify-end align-center mt-4">
      <div class="text-h6 mr-4">Итого: ${{ Number(subtotal).toFixed(2) }}</div>
      <v-btn color="primary" x-large to="/checkout">Оформить заказ</v-btn>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "CartPage",
  computed: {
    ...mapState({ items: (s) => (s.cart ? s.cart.items : []), subtotal: (s) => (s.cart ? s.cart.subtotal : 0) }),
  },
  mounted() {
    this.$store.dispatch("loadCart");
  },
  methods: {
    async setQty(item, quantity) {
      if (quantity < 1) return;
      try {
        await this.$store.dispatch("setQuantity", { itemId: item.id, quantity });
      } catch (err) {
        this.$store.commit("setError", err.response?.data?.message || "Ошибка");
      }
    },
    async remove(itemId) {
      await this.$store.dispatch("removeItem", itemId);
    },
  },
};
</script>
