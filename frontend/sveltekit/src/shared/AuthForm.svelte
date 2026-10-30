<script lang="ts">
  import { goto } from '$app/navigation';
  import { login, register } from '$lib/session.svelte';
  import { errorMessage } from '$lib/api';

  let { mode = 'login' }: { mode?: 'login' | 'register' } = $props();

  let form = $state({ name: '', email: '', password: '' });
  let busy = $state(false);
  let error = $state('');

  async function submit() {
    busy = true;
    error = '';
    try {
      if (mode === 'register') await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      goto('/');
    } catch (e) {
      error = errorMessage(e);
    } finally {
      busy = false;
    }
  }
</script>

<div class="wrap">
  <h1>{mode === 'register' ? 'Регистрация' : 'Вход'}</h1>
  {#if mode === 'register'}
    <input placeholder="Имя" bind:value={form.name} />
  {/if}
  <input placeholder="Email" type="email" bind:value={form.email} />
  <input placeholder="Пароль" type="password" bind:value={form.password} />
  {#if error}<div class="error">{error}</div>{/if}
  <button disabled={busy} onclick={submit}>{mode === 'register' ? 'Создать аккаунт' : 'Войти'}</button>
  <p class="demo">Демо: buyer@demo.dev, seller@demo.dev, moderator@demo.dev, admin@demo.dev — пароль «password»</p>
</div>

<style>
  .wrap { max-width: 420px; margin: 48px auto 0; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 28px; display: flex; flex-direction: column; gap: 12px; }
  input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; }
  button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 10px; cursor: pointer; }
  .error { color: #c62828; }
  .demo { color: #777; font-size: 12px; }
</style>
