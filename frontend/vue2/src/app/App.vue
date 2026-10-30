<template>
  <v-app>
    <v-app-bar dark color="#102a43">
      <v-toolbar-title class="cursor-pointer" @click="$router.push('/')">
        Polyglot Market
        <v-chip v-if="$store.state.user" small outlined text-color="white">{{ roleLabel }}</v-chip>
      </v-toolbar-title>
      <v-spacer />
      <v-btn text to="/">Каталог</v-btn>
      <v-btn text to="/cart">Корзина<v-badge v-if="cartCount" :content="String(cartCount)" inline color="amber" /></v-btn>
      <template v-if="$store.getters.isAuth">
        <v-btn v-if="$store.getters.role === 'seller'" text to="/seller/products">Мои товары</v-btn>
        <v-btn v-if="['moderator', 'admin'].includes($store.getters.role)" text to="/moderator/queue">Модерация</v-btn>
        <v-btn v-if="$store.getters.role === 'admin'" text to="/admin/orders">Админ</v-btn>
        <v-btn text to="/orders">Заказы</v-btn>
        <v-btn icon @click="logout"><v-icon>mdi-logout</v-icon></v-btn>
      </template>
      <template v-else>
        <v-btn text to="/login">Войти</v-btn>
        <v-btn text to="/register">Регистрация</v-btn>
      </template>
    </v-app-bar>

    <v-main style="min-height: calc(100vh - 88px)">
      <router-view />
    </v-main>

    <v-footer class="text-caption text--secondary justify-center" color="transparent">
      Polyglot Market — Vue 2.7 + Vuex + Vuetify 2 · демо: buyer@demo.dev / password
    </v-footer>

    <v-snackbar v-model="snackbar" :timeout="2500">{{ $store.state.lastError || "Готово" }}</v-snackbar>
  </v-app>
</template>

<script>
export default {
  name: "App",
  data: () => ({ snackbar: false }),
  computed: {
    cartCount() {
      return this.$store.getters.cartCount;
    },
    roleLabel() {
      const labels = { buyer: "покупатель", seller: "продавец", moderator: "модератор", admin: "админ" };
      return this.$store.state.user ? labels[this.$store.state.user.role] : "";
    },
  },
  methods: {
    logout() {
      this.$store.dispatch("logout");
      this.$router.push("/");
    },
  },
};
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
