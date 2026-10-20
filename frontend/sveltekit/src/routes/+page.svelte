<script lang="ts">
  import { goto } from '$app/navigation';
  import { addToCart, cart } from '$lib/session.svelte';

  let { data } = $props();

  let q = $state('');
  let category = $state('');
  let sort = $state('newest');
  let error = $state('');
  let notice = $state('');

  const sortOptions = [
    { value: 'newest', label: 'Сначала новые' },
    { value: 'oldest', label: 'Сначала старые' },
    { value: 'price_asc', label: 'Дешевле' },
    { value: 'price_desc', label: 'Дороже' }
  ];

  const image = (p: any) => {
    const primary = (p.images || []).find((i: any) => i.isPrimary) || (p.images || [])[0];
    return primary ? primary.url : '';
  };

  async function add(p: any) {
    error = (await addToCart(p.id, 1)) ?? '';
    if (!error) {
      notice = 'Добавлено в корзину';
      setTimeout(() => (notice = ''), 1200);
    }
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort !== 'newest') params.set('sort', sort);
    goto(`/?${params.toString()}`);
  }
</script>

<div class="filters">
  <input placeholder="Поиск по названию" bind:value={q} onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
  <select bind:value={category} onchange={applyFilters}>
    <option value="">Все категории</option>
    {#each data.categories as c (c.id)}
      <option value={c.slug}>{c.name}</option>
    {/each}
  </select>
  <select bind:value={sort} onchange={applyFilters}>
    {#each sortOptions as o (o.value)}
      <option value={o.value}>{o.label}</option>
    {/each}
  </select>
</div>

{#if error}<div class="error">{error}</div>{/if}
{#if notice}<div class="notice">{notice}</div>{/if}

<div class="grid">
  {#each data.products as p (p.id)}
    <div class="card" role="button" tabindex={0} onclick={() => goto(`/product/${p.id}`)}>
      <img src={image(p)} alt={p.title} />
      <div class="body">
        <div class="title">{p.title}</div>
        <div class="meta">{p.category.name} · {p.seller.shopName}</div>
        <div class="price">${Number(p.price).toFixed(2)}</div>
      </div>
      <div class="actions">
        <span class="stock" class:out={p.stock <= 0}>{p.stock > 0 ? `в наличии: ${p.stock}` : 'нет'}</span>
        <button disabled={p.stock <= 0} onclick={(e) => { e.stopPropagation(); add(p); }}>В корзину</button>
      </div>
    </div>
  {/each}
</div>

{#if data.meta.lastPage > 1}
  <div class="pager">
    {#each Array(data.meta.lastPage) as _, i (i)}
      <button class:current={i + 1 === data.meta.currentPage} onclick={() => goto(`/?page=${i + 1}`)}>{i + 1}</button>
    {/each}
  </div>
{/if}

<style>
  .filters { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
  .filters input, .filters select { padding: 8px; border: 1px solid #ccc; border-radius: 6px; }
  .filters input { flex: 1 1 260px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
  .card { background: #fff; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; cursor: pointer; }
  .card img { width: 100%; height: 180px; object-fit: cover; }
  .body { padding: 10px 12px; }
  .title { font-weight: 600; min-height: 40px; }
  .meta { color: #777; font-size: 12px; }
  .price { font-size: 18px; font-weight: 700; margin-top: 6px; }
  .actions { display: flex; justify-content: space-between; align-items: center; padding: 0 12px 10px; }
  .stock { font-size: 12px; color: #2e7d32; }
  .stock.out { color: #999; }
  .actions button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
  .error { color: #c62828; margin-bottom: 10px; }
  .notice { color: #2e7d32; margin-bottom: 10px; }
  .pager { display: flex; gap: 6px; justify-content: center; margin-top: 20px; }
  .pager button { padding: 4px 10px; border: 1px solid #ccc; background: #fff; border-radius: 6px; cursor: pointer; }
  .pager .current { background: #1f4a7a; color: #fff; }
</style>
