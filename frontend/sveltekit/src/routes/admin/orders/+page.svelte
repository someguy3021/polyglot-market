<script lang="ts">
  import { onMount } from 'svelte';
  import { api, errorMessage } from '$lib/api';

  interface AdminOrder {
    id: string; status: string; total: number; createdAt: string;
    items: Array<{ id: string; title: string; quantity: number }>;
  }

  let orders = $state<AdminOrder[]>([]);
  let error = $state('');

  const transitions: Record<string, string[]> = {
    new: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['done'],
    done: [],
    cancelled: [],
  };
  const labels: Record<string, string> = { new: 'новый', paid: 'оплачен', shipped: 'отправлен', done: 'доставлен', cancelled: 'отменён' };

  async function load() {
    const res = await api.admin.listAllOrders(1, 50);
    orders = res.data.data;
  }

  async function changeStatus(id: string, status: string) {
    try {
      await api.admin.updateOrderStatus(id, { status });
      await load();
    } catch (e) {
      error = errorMessage(e);
      await load();
    }
  }

  onMount(load);
</script>

<div class="wrap">
  <h1>Админ — заказы</h1>
  {#if error}<div class="error">{error}</div>{/if}
  <table>
    <thead><tr><th>Заказ</th><th>Позиции</th><th>Сумма</th><th>Статус →</th></tr></thead>
    <tbody>
      {#each orders as o (o.id)}
        <tr>
          <td>#{o.id.slice(0, 8)}…</td>
          <td>{#each o.items as i (i.id)}<div>{i.title} × {i.quantity}</div>{/each}</td>
          <td>${{ v: o.total }.v.toFixed(2)}</td>
          <td>
            <select value={o.status} onchange={(e) => changeStatus(o.id, e.currentTarget.value)}>
              {#each [o.status, ...(transitions[o.status] ?? [])] as s (s)}
                <option value={s}>{labels[s] ?? s}</option>
              {/each}
            </select>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .wrap { max-width: 1100px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-size: 14px; }
  select { padding: 6px; }
  .error { color: #c62828; }
</style>
