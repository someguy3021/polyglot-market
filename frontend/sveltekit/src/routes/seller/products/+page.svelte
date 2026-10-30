<script lang="ts">
  import { onMount } from 'svelte';
  import { api, errorMessage } from '$shared/api';

  interface SellerProduct {
    id: string; title: string; price: number; stock: number;
    status: string; rejectionReason: string | null;
  }

  let products = $state<SellerProduct[]>([]);
  let error = $state('');
  const labels: Record<string, string> = { draft: 'черновик', pending_moderation: 'на модерации', approved: 'в продаже', rejected: 'отклонён' };

  async function load() {
    const res = await api.seller.listSellerProducts(1, 50);
    products = res.data.data;
  }

  async function submit(id: string) {
    try {
      await api.seller.submitSellerProduct(id);
      await load();
    } catch (e) {
      error = errorMessage(e);
    }
  }

  async function upload(id: string, input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    try {
      await api.seller.uploadProductImage(id, file);
      await load();
    } catch (e) {
      error = errorMessage(e);
    }
  }

  onMount(load);
</script>

<div class="wrap">
  <h1>Мои товары</h1>
  {#if error}<div class="error">{error}</div>{/if}
  <table>
    <thead><tr><th>Товар</th><th>Цена</th><th>Остаток</th><th>Статус</th><th>Действия</th></tr></thead>
    <tbody>
      {#each products as p (p.id)}
        <tr>
          <td>{p.title}</td>
          <td>${{ v: p.price }.v.toFixed(2)}</td>
          <td>{p.stock}</td>
          <td>{labels[p.status] ?? p.status}{p.rejectionReason ? ` — ${p.rejectionReason}` : ''}</td>
          <td>
            {#if ['draft', 'rejected'].includes(p.status)}
              <button onclick={() => submit(p.id)}>На модерацию</button>
            {/if}
            {#if ['draft', 'approved'].includes(p.status)}
              <input type="file" accept="image/png,image/jpeg,image/webp" onchange={(e) => upload(p.id, e.currentTarget)} />
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .wrap { max-width: 1000px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-size: 14px; }
  button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
  .error { color: #c62828; }
</style>
