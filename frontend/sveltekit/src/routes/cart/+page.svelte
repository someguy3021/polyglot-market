<script lang="ts">
  import { onMount } from 'svelte';
  import { api, errorMessage } from '$shared/api';
  import { cart, loadCart } from '$shared/session.svelte';

  let error = $state('');

  onMount(() => {
    loadCart().catch((e) => (error = errorMessage(e)));
  });

  async function setQty(itemId: string, quantity: number) {
    if (quantity < 1) return;
    try {
      const res = await api.cart.updateCartItem(itemId, { quantity });
      const body = res.data as any;
      cart.items = body.items ?? [];
      cart.subtotal = body.subtotal ?? 0;
      cart.count = cart.items.reduce((a: number, i: any) => a + i.quantity, 0);
    } catch (e) {
      error = errorMessage(e);
    }
  }

  async function remove(itemId: string) {
    try {
      const res = await api.cart.deleteCartItem(itemId);
      const body = res.data as any;
      cart.items = body.items ?? [];
      cart.subtotal = body.subtotal ?? 0;
      cart.count = cart.items.reduce((a: number, i: any) => a + i.quantity, 0);
    } catch (e) {
      error = errorMessage(e);
    }
  }

  const image = (item: any) =>
    item.product.images?.find((x: any) => x.isPrimary)?.url ?? item.product.images?.[0]?.url ?? '';
</script>

<div class="wrap">
  <h1>Корзина</h1>
  {#if error}<div class="error">{error}</div>{/if}
  {#if cart.items.length === 0}
    <p>Корзина пуста. <a href="/">К каталогу</a></p>
  {:else}
    {#each cart.items as item (item.id)}
      <div class="row">
        <img src={image(item)} alt="" />
        <div class="info">
          <div>{item.product.title}</div>
          <div class="meta">${Number(item.product.price).toFixed(2)} × {item.quantity} = ${Number(item.lineTotal).toFixed(2)}</div>
        </div>
        <div class="controls">
          <button onclick={() => setQty(item.id, item.quantity - 1)}>−</button>
          <span>{item.quantity}</span>
          <button onclick={() => setQty(item.id, item.quantity + 1)}>+</button>
          <button class="del" onclick={() => remove(item.id)}>✕</button>
        </div>
      </div>
    {/each}
    <div class="total">
      <span>Итого: ${Number(cart.subtotal).toFixed(2)}</span>
      <a href="/checkout"><button>Оформить заказ</button></a>
    </div>
  {/if}
</div>

<style>
  .wrap { max-width: 900px; margin: 0 auto; }
  .row { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; }
  .row img { width: 72px; height: 56px; object-fit: cover; border-radius: 6px; }
  .info { flex: 1; }
  .meta { color: #777; font-size: 13px; }
  .controls { display: flex; align-items: center; gap: 8px; }
  .controls button { border: 1px solid #ccc; background: #fff; border-radius: 6px; width: 30px; height: 30px; cursor: pointer; }
  .controls .del { color: #c62828; }
  .total { display: flex; justify-content: flex-end; align-items: center; gap: 16px; font-size: 20px; font-weight: 700; }
  .total button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 12px 20px; cursor: pointer; }
  .error { color: #c62828; }
</style>
