<script setup lang="ts">
const cart = useCart();

// при прямой загрузке /cart (F5, внешний переход) useState пуст — тянем корзину с сервера
onMounted(() => {
  void loadCart();
});

async function setQty(itemId: string, quantity: number) {
  if (quantity < 1) return;
  const api = useApi();
  const res = await api.cart.updateCartItem(itemId, { quantity });
  const body = res.data as any;
  cart.value = { id: body.id, subtotal: body.subtotal ?? 0, items: body.items ?? [] };
}

async function remove(itemId: string) {
  const api = useApi();
  const res = await api.cart.deleteCartItem(itemId);
  const body = res.data as any;
  cart.value = { id: body.id, subtotal: body.subtotal ?? 0, items: body.items ?? [] };
}

const image = (item: any) =>
  item.product.images?.find((x: any) => x.isPrimary)?.url ?? item.product.images?.[0]?.url ?? "";
</script>

<template>
  <h1>Корзина</h1>
  <p v-if="cart.items.length === 0">Корзина пуста. <NuxtLink to="/">К каталогу</NuxtLink></p>
  <div v-for="item in cart.items" :key="item.id" class="row">
    <img :src="image(item)" alt="" />
    <div class="info">
      <div>{{ item.product.title }}</div>
      <div class="meta">${{ Number(item.product.price).toFixed(2) }} × {{ item.quantity }} = ${{ Number(item.lineTotal).toFixed(2) }}</div>
    </div>
    <div class="controls">
      <button @click="setQty(item.id, item.quantity - 1)">−</button>
      <span>{{ item.quantity }}</span>
      <button @click="setQty(item.id, item.quantity + 1)">+</button>
      <button class="del" @click="remove(item.id)">✕</button>
    </div>
  </div>
  <div v-if="cart.items.length" class="total">
    <span>Итого: ${{ Number(cart.subtotal).toFixed(2) }}</span>
    <NuxtLink to="/checkout"><button class="primary">Оформить заказ</button></NuxtLink>
  </div>
</template>

<style scoped>
.row { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; }
.row img { width: 72px; height: 56px; object-fit: cover; border-radius: 6px; }
.info { flex: 1; }
.meta { color: #777; font-size: 13px; }
.controls { display: flex; align-items: center; gap: 8px; }
.controls button { border: 1px solid #ccc; background: #fff; border-radius: 6px; width: 30px; height: 30px; cursor: pointer; }
.controls .del { color: #c62828; }
.total { display: flex; justify-content: flex-end; align-items: center; gap: 16px; font-size: 20px; font-weight: 700; }
.total a { text-decoration: none; }
</style>
