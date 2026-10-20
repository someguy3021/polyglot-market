<script lang="ts">
  import { onMount } from 'svelte';
  import { api, errorMessage } from '$lib/api';

  interface QueueItem {
    id: string; title: string; price: number; seller: { shopName: string };
  }

  let queue = $state<QueueItem[]>([]);
  let rejecting = $state<string | null>(null);
  let reason = $state('');
  let error = $state('');

  async function load() {
    const res = await api.moderation.moderationQueue(1, 50);
    queue = res.data.data;
  }

  async function approve(id: string) {
    try {
      await api.moderation.approveProduct(id);
      await load();
    } catch (e) {
      error = errorMessage(e);
    }
  }

  async function reject() {
    if (!rejecting) return;
    try {
      await api.moderation.rejectProduct(rejecting, { reason });
      rejecting = null;
      reason = '';
      await load();
    } catch (e) {
      error = errorMessage(e);
    }
  }

  onMount(load);
</script>

<div class="wrap">
  <h1>Очередь модерации</h1>
  {#if error}<div class="error">{error}</div>{/if}
  <table>
    <thead><tr><th>Товар</th><th>Цена</th><th>Продавец</th><th>Решение</th></tr></thead>
    <tbody>
      {#each queue as p (p.id)}
        <tr>
          <td>{p.title}</td>
          <td>${{ v: p.price }.v.toFixed(2)}</td>
          <td>{p.seller.shopName}</td>
          <td>
            <button class="ok" onclick={() => approve(p.id)}>Одобрить</button>
            <button class="bad" onclick={() => (rejecting = p.id)}>Отклонить</button>
          </td>
        </tr>
      {:else}
        <tr><td colspan="4">Очередь пуста</td></tr>
      {/each}
    </tbody>
  </table>

  {#if rejecting}
    <div class="modal">
      <h3>Причина отклонения</h3>
      <textarea bind:value={reason} placeholder="Что исправить продавцу"></textarea>
      <div class="row">
        <button onclick={() => (rejecting = null)}>Отмена</button>
        <button class="bad" onclick={reject}>Отклонить</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .wrap { max-width: 1000px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-size: 14px; }
  button { border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
  .ok { background: #2e7d32; color: #fff; margin-right: 6px; }
  .bad { background: #c62828; color: #fff; }
  .modal { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: rgba(0,0,0,.4); }
  .modal textarea { width: 380px; height: 120px; }
  .row { display: flex; gap: 10px; margin-top: 10px; }
  .error { color: #c62828; }
</style>
