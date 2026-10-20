<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let orders = $state<Array<any>>([]);
  let loaded = $state(false);

  const labels: Record<string, string> = { new: 'новый', paid: 'оплачен', shipped: 'отправлен', done: 'доставлен', cancelled: 'отменён' };
  const colors: Record<string, string> = { new: '#1565c0', paid: '#b26a00', shipped: '#6a1b9a', done: '#2e7d32', cancelled: '#c62828' };

  onMount(async () => {
    const res = await api.orders.listMyOrders(1, 20);
    orders = res.data.data;
    loaded = true;
  });
</script>

<div class="wrap">
  <h1>Мои заказы</h1>
  {#each orders as o (o.id)}
    <div class="card">
      <div class="head">
        <div>
          Заказ #{o.id.slice(0, 8)}…
          <span class="chip" style="background: {colors[o.status] ?? '#999'}">{labels[o.status] ?? o.status}</span>
        </div>
        <strong>${Number(o.total).toFixed(2)}</strong>
      </div>
      <div class="meta">{new Date(o.createdAt).toLocaleString('ru')} · {o.shippingMethod.name}</div>
      {#each o.items as i (i.id)}
        <div class="item">{i.title} × {i.quantity} — ${Number(i.price).toFixed(2)}</div>
      {/each}
    </div>
  {/each}
  {#if loaded && orders.length === 0}
    <p>Заказов пока нет. <a href="/">К каталогу</a></p>
  {/if}
</div>

<style>
  .wrap { max-width: 900px; margin: 0 auto; }
  .card { background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; }
  .head { display: flex; justify-content: space-between; align-items: center; font-size: 16px; }
  .chip { color: #fff; border-radius: 12px; padding: 2px 10px; font-size: 12px; }
  .meta { color: #777; font-size: 12px; margin: 4px 0; }
  .item { font-size: 14px; }
</style>
