<template>
  <div class="app">
    <header>
      <NuxtLink to="/" class="brand">Polyglot Market <span v-if="user" class="role">{{ user.role }}</span></NuxtLink>
      <nav>
        <NuxtLink to="/">Каталог</NuxtLink>
        <NuxtLink to="/cart">Корзина<b v-if="count" class="badge">{{ count }}</b></NuxtLink>
        <template v-if="user">
          <NuxtLink v-if="user.role === 'seller'" to="/seller/products">Мои товары</NuxtLink>
          <NuxtLink v-if="['moderator', 'admin'].includes(user.role)" to="/moderator/queue">Модерация</NuxtLink>
          <NuxtLink v-if="user.role === 'admin'" to="/admin/orders">Админ</NuxtLink>
        </template>
        <template v-if="user">
          <NuxtLink to="/orders">Заказы</NuxtLink>
          <a href="#" @click.prevent="doLogout">Выйти</a>
        </template>
        <template v-else>
          <NuxtLink to="/login">Войти</NuxtLink>
          <NuxtLink to="/register">Регистрация</NuxtLink>
        </template>
      </nav>
    </header>
    <main>
      <NuxtPage />
    </main>
    <footer>Polyglot Market — Nuxt (SSR) · демо: buyer@demo.dev / password</footer>
  </div>
</template>

<script setup lang="ts">
const user = useSession();
const cart = useCart();
const count = computed(() => cart.value.items.reduce((a, i) => a + (i.quantity ?? 0), 0));

function doLogout() {
  logout();
}
</script>

<style>
:root { color-scheme: light; }
body { margin: 0; font-family: system-ui, sans-serif; background: #f5f6f8; color: #1a202c; }
.app { min-height: 100vh; display: flex; flex-direction: column; }
header { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, #102a43, #1f4a7a); color: #fff; padding: 12px 28px; }
.brand { color: #fff; font-weight: 700; font-size: 18px; text-decoration: none; }
.role { border: 1px solid rgba(255,255,255,.5); border-radius: 10px; padding: 0 8px; font-size: 12px; font-weight: 400; }
nav { display: flex; gap: 14px; }
nav a { color: #fff; text-decoration: none; opacity: .85; }
nav a:hover { opacity: 1; }
.badge { background: #d29922; color: #1a202c; border-radius: 10px; padding: 0 6px; font-size: 12px; }
main { flex: 1; padding: 20px 28px; max-width: 1200px; width: 100%; margin: 0 auto; box-sizing: border-box; }
footer { text-align: center; padding: 14px; color: #666; font-size: 13px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
.card { background: #fff; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; cursor: pointer; }
.card img { width: 100%; height: 180px; object-fit: cover; }
.card .body { padding: 10px 12px; }
.card .title { font-weight: 600; }
.card .meta { color: #777; font-size: 12px; }
.card .price { font-size: 18px; font-weight: 700; margin-top: 6px; }
.card .actions { display: flex; justify-content: space-between; align-items: center; padding: 0 12px 10px; }
button.primary { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 7px 12px; cursor: pointer; }
button.primary:disabled { opacity: .5; }
.stock { font-size: 12px; color: #2e7d32; }
.stock.out { color: #999; }
input, select { padding: 8px; border: 1px solid #ccc; border-radius: 6px; background: #fff; }
.error { color: #c62828; }
.notice { color: #2e7d32; }
</style>
