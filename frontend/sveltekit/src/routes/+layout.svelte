<script lang="ts">
  import { page } from '$app/stores';
  import { session, cart, logout } from '$lib/session.svelte';
  import { goto } from '$app/navigation';

  let { children } = $props();

  const links: Array<{ href: string; label: string; show: boolean }> = [
    { href: '/', label: 'Каталог', show: true },
    { href: '/cart', label: 'Корзина', show: true },
    { href: '/orders', label: 'Заказы', show: Boolean(session.user) },
    { href: '/seller/products', label: 'Мои товары', show: session.user?.role === 'seller' },
    { href: '/moderator/queue', label: 'Модерация', show: session.user?.role === 'moderator' || session.user?.role === 'admin' },
    { href: '/admin/orders', label: 'Админ', show: session.user?.role === 'admin' }
  ];
</script>

<div class="app">
  <header>
    <span class="brand" role="button" tabindex={0} onclick={() => goto('/')}>Polyglot Market</span>
    <nav>
      {#each links as link (link.href)}
        {#if link.show}
          <a href={link.href} class:active={$page.url.pathname === link.href}>{link.label}</a>
        {/if}
      {/each}
      {#if session.user}
        <span class="role">{session.user.role}</span>
        <button onclick={logout}>Выйти</button>
      {:else}
        <a href="/login" class:active={$page.url.pathname === '/login'}>Войти</a>
        <a href="/register">Регистрация</a>
      {/if}
    </nav>
  </header>

  <main>
    {@render children?.()}
  </main>

  <footer>Polyglot Market — SvelteKit (Svelte 5 runes) · демо: buyer@demo.dev / password</footer>
</div>

<style>
  :global(body) { margin: 0; font-family: system-ui, sans-serif; background: #f5f6f8; color: #1a202c; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  header {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(90deg, #102a43, #1f4a7a); color: #fff; padding: 12px 28px;
  }
  .brand { font-weight: 700; font-size: 18px; cursor: pointer; }
  nav { display: flex; gap: 14px; align-items: center; }
  nav a { color: #fff; text-decoration: none; opacity: 0.85; }
  nav a.active { opacity: 1; border-bottom: 2px solid #d29922; }
  .role { border: 1px solid rgba(255,255,255,0.5); border-radius: 10px; padding: 0 8px; font-size: 12px; }
  button { border: none; background: transparent; color: #fff; cursor: pointer; }
  main { flex: 1; padding: 20px 28px; max-width: 1200px; width: 100%; margin: 0 auto; box-sizing: border-box; }
  footer { text-align: center; padding: 14px; color: #666; font-size: 13px; }
</style>
