<script lang="ts">
  import { api, errorMessage } from '$lib/api';
  import { addToCart } from '$lib/session.svelte';

  let { data } = $props();

  let product = $state<any>(null);
  let qty = $state(1);
  let current = $state('');
  let error = $state('');

  $effect(() => {
    api.catalog.getProduct(data.id).then((res) => (product = res.data)).catch((e) => (error = errorMessage(e)));
  });

  const primary = $derived(
    current || product?.images?.find((i: any) => i.isPrimary)?.url || product?.images?.[0]?.url || ''
  );

  async function add() {
    error = (await addToCart(product.id, qty)) ?? '';
  }
</script>

<svelte:head><title>{product?.title ?? 'Товар'} — Polyglot Market</title></svelte:head>

{#if !product}
  <p>Загрузка…</p>
{:else}
  <div class="wrap">
    <div class="media">
      <img src={primary} alt={product.title} style="max-height: 420px; object-fit: contain" />
      <div class="thumbs">
        {#each product.images as img (img.id)}
          <img src={img.thumbUrl ?? img.url} class:active={img.url === primary} onclick={() => (current = img.url)} alt="" />
        {/each}
      </div>
    </div>
    <div class="info">
      <h1>{product.title}</h1>
      <p class="meta">{product.category.name} · продает {product.seller.shopName}</p>
      <p class="price">${{ v: Number(product.price) }.v.toFixed(2)}</p>
      <p>{product.description}</p>
      <span class="stock" class:out={product.stock <= 0}>
        {product.stock > 0 ? `в наличии: ${product.stock}` : 'нет в наличии'}
      </span>
      <div class="buy">
        <input type="number" bind:value={qty} min="1" max={product.stock} />
        <button disabled={product.stock <= 0} onclick={add}>Добавить в корзину</button>
        <a href="/cart">Перейти в корзину</a>
      </div>
      {#if error}<p class="error">{error}</p>{/if}
    </div>
  </div>
{/if}

<style>
  .wrap { display: flex; gap: 28px; flex-wrap: wrap; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 24px; }
  .media { flex: 1 1 320px; }
  .thumbs { display: flex; gap: 8px; margin-top: 10px; }
  .thumbs img { width: 72px; height: 56px; object-fit: cover; border-radius: 6px; cursor: pointer; }
  .thumbs img.active { outline: 2px solid #1f4a7a; }
  .info { flex: 1 1 320px; }
  .meta { color: #777; font-size: 13px; }
  .price { font-size: 32px; font-weight: 700; }
  .stock { font-size: 13px; color: #2e7d32; }
  .stock.out { color: #999; }
  .buy { display: flex; gap: 12px; align-items: center; margin-top: 24px; }
  .buy input { width: 80px; padding: 8px; }
  .buy button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 10px 16px; cursor: pointer; }
  .error { color: #c62828; }
</style>
