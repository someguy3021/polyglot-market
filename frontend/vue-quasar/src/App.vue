<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="brand-bar">
      <q-toolbar class="container">
        <q-toolbar-title class="text-weight-bold cursor-pointer" @click="router.push('/')">
          Polyglot Market
          <q-badge v-if="session.user" outline color="white" class="q-ml-sm">{{ roleLabel }}</q-badge>
        </q-toolbar-title>

        <q-btn flat to="/" label="Каталог" />
        <q-btn flat to="/cart" label="Корзина">
          <q-badge v-if="cart.count > 0" color="amber-8" floating>{{ cart.count }}</q-badge>
        </q-btn>

        <template v-if="session.isAuth">
          <q-btn v-if="session.isSeller" flat to="/seller/products" label="Мои товары" />
          <q-btn v-if="session.isModerator || session.isAdmin" flat to="/moderator/queue" label="Модерация" />
          <q-btn v-if="session.isAdmin" flat to="/admin/orders" label="Админ" />
          <q-btn flat to="/orders" label="Заказы" />
          <q-btn flat icon="logout" @click="logout" />
        </template>
        <template v-else>
          <q-btn flat to="/login" label="Войти" />
          <q-btn flat to="/register" label="Регистрация" />
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view style="min-height: calc(100vh - 120px)" />
    </q-page-container>

    <q-footer class="text-caption text-grey-6 q-pa-md text-center" style="background: transparent">
      Polyglot Market — Vue 3 + Quasar · Laravel / NestJS ·
      <router-link to="/login" style="color: inherit">демо-доступ buyer@demo.dev / password</router-link>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useSession } from "./stores/session";
import { useCart } from "./stores/cart";

const router = useRouter();
const session = useSession();
const cart = useCart();

const roleLabels: Record<string, string> = {
  buyer: "покупатель",
  seller: "продавец",
  moderator: "модератор",
  admin: "админ",
};
const roleLabel = computed(() => (session.user ? roleLabels[session.user.role] ?? session.user.role : ""));

function logout() {
  session.logout();
  void cart.reload();
  void router.push("/");
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
