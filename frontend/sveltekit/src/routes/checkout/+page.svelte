<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, errorMessage, setOrderIdempotencyKey } from '$shared/api';
  import { cart, loadCart } from '$shared/session.svelte';

  let shipping = $state<Array<{ code: string; name: string; price: number; etaDays: number }>>([]);
  let method = $state('');
  let promoCode = $state('');
  let promo = $state<{ valid: boolean; discount: number } | null>(null);
  let error = $state('');
  let placing = $state(false);
  let address = $state({ line1: '', line2: '', city: '', zip: '', country: 'US' });

  const shippingPrice = $derived(shipping.find((m) => m.code === method)?.price ?? 0);
  const total = $derived(Math.max(0, cart.subtotal - (promo?.discount ?? 0)) + shippingPrice);
  const canPlace = $derived(cart.items.length > 0 && method !== '' && address.line1 !== '' && address.city !== '' && address.zip !== '');

  onMount(async () => {
    await loadCart();
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/shipping-methods`);
    const body = await res.json();
    shipping = body.data;
    if (shipping.length) method = shipping[0].code;
  });

  async function checkPromo() {
    try {
      const res = await api.orders.validatePromo({ code: promoCode, subtotal: cart.subtotal });
      promo = (res.data as any).valid ? (res.data as any) : null;
    } catch (e) {
      promo = null;
      error = errorMessage(e);
    }
  }

  async function place() {
    placing = true;
    const key = crypto.randomUUID();
    setOrderIdempotencyKey(key);
    try {
      await api.orders.createOrder(key, {
        shippingMethodCode: method,
        promoCode: promo ? promoCode || undefined : undefined,
        shippingAddress: {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          zip: address.zip,
          country: address.country.toUpperCase()
        }
      });
      setOrderIdempotencyKey(undefined);
      await loadCart();
      goto('/orders');
    } catch (e) {
      setOrderIdempotencyKey(undefined);
      error = errorMessage(e);
    } finally {
      placing = false;
    }
  }
</script>

<div class="wrap">
  <h1>Оформление заказа</h1>
  {#if cart.items.length === 0}
    <p>Корзина пуста. <a href="/">К каталогу</a></p>
  {:else}
    <h3>1. Доставка</h3>
    {#each shipping as m (m.code)}
      <label class="ship">
        <input type="radio" bind:group={method} value={m.code} />
        {m.name} — ${m.price.toFixed(2)} · {m.etaDays} дн.
      </label>
    {/each}

    <h3>2. Промокод</h3>
    <div class="promo">
      <input placeholder="Промокод (например WELCOME10)" bind:value={promoCode} />
      <button onclick={checkPromo}>Проверить</button>
      {#if promo}<span class="chip">скидка ${promo.discount.toFixed(2)}</span>{/if}
    </div>

    <h3>3. Адрес</h3>
    <div class="addr">
      <input placeholder="Улица, дом" bind:value={address.line1} />
      <input placeholder="Квартира (опц.)" bind:value={address.line2} />
      <input placeholder="Город" bind:value={address.city} />
      <input placeholder="Индекс" bind:value={address.zip} />
      <input placeholder="US" bind:value={address.country} maxlength={2} />
    </div>

    {#if error}<div class="error">{error}</div>{/if}

    <div class="total">
      <span>
        Товары: ${cart.subtotal.toFixed(2)}
        {#if promo}· скидка: −${promo.discount.toFixed(2)}{/if}
        {#if method}· доставка: ${shippingPrice.toFixed(2)}{/if}
      </span>
      <strong>К оплате: ${total.toFixed(2)}</strong>
      <button disabled={!canPlace || placing} onclick={place}>{placing ? 'Оформляем…' : 'Подтвердить заказ'}</button>
    </div>
  {/if}
</div>

<style>
  .wrap { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 24px; }
  h3 { margin: 14px 0 8px; }
  .ship { display: block; padding: 6px 0; }
  .promo { display: flex; gap: 10px; align-items: center; }
  .promo input { padding: 8px; border: 1px solid #ccc; border-radius: 6px; width: 300px; }
  .chip { background: #2e7d32; color: #fff; border-radius: 12px; padding: 2px 10px; font-size: 13px; }
  .addr { display: flex; flex-wrap: wrap; gap: 10px; }
  .addr input { padding: 8px; border: 1px solid #ccc; border-radius: 6px; flex: 1 1 200px; }
  .total { display: flex; justify-content: flex-end; align-items: center; gap: 16px; margin-top: 20px; }
  .total button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 12px 20px; cursor: pointer; font-size: 16px; }
  .total button:disabled { opacity: 0.5; }
  .error { color: #c62828; margin-top: 10px; }
</style>
