<script setup lang="ts">
const api = useApi();
const cart = useCart();
const user = useSession();
const router = useRouter();

const { data: methods } = await useAsyncData("shipping", () => $fetch(`${useRuntimeConfig().public.apiUrl}/shipping-methods`));

const method = ref("");
const promoCode = ref("");
const promo = ref<{ valid: boolean; discount: number } | null>(null);
const error = ref("");
const placing = ref(false);
const address = reactive({ line1: "", line2: "", city: "", zip: "", country: "US" });

watchEffect(() => {
  const list = (methods.value?.data ?? []) as Array<{ code: string }>;
  if (list.length && !method.value) method.value = list[0]!.code;
});

const shippingPrice = computed(() => ((methods.value?.data ?? []) as any[]).find((m) => m.code === method.value)?.price ?? 0);
const discount = computed(() => (promo.value?.valid ? promo.value.discount : 0));
const total = computed(() => Math.max(0, cart.value.subtotal - discount.value) + shippingPrice.value);
const canPlace = computed(() => cart.value.items.length > 0 && method.value !== "" && address.line1 !== "" && address.city !== "" && address.zip !== "");

async function checkPromo() {
  try {
    const res = await api.orders.validatePromo({ code: promoCode.value, subtotal: cart.value.subtotal });
    promo.value = (res.data as any).valid ? (res.data as any) : null;
  } catch (err) {
    promo.value = null;
    error.value = errorMessage(err);
  }
}

async function place() {
  placing.value = true;
  const key = crypto.randomUUID();
  setOrderIdempotencyKey(key);
  try {
    await api.orders.createOrder(key, {
      shippingMethodCode: method.value,
      promoCode: promo.value?.valid ? promoCode.value || undefined : undefined,
      shippingAddress: {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        zip: address.zip,
        country: address.country.toUpperCase(),
      },
    });
    setOrderIdempotencyKey(undefined);
    await loadCart();
    router.push("/orders");
  } catch (err) {
    setOrderIdempotencyKey(undefined);
    error.value = errorMessage(err);
  } finally {
    placing.value = false;
  }
  void user;
}
</script>

<template>
  <div class="wrap">
    <h1>Оформление заказа</h1>
    <p v-if="cart.items.length === 0">Корзина пуста. <NuxtLink to="/">К каталогу</NuxtLink></p>
    <template v-else>
      <h3>1. Доставка</h3>
      <label v-for="m in methods?.data ?? []" :key="m.code" class="ship">
        <input v-model="method" type="radio" :value="m.code" />
        {{ m.name }} — ${{ Number(m.price).toFixed(2) }} · {{ m.etaDays }} дн.
      </label>

      <h3>2. Промокод</h3>
      <div class="promo">
        <input v-model="promoCode" placeholder="Промокод (например WELCOME10)" />
        <button @click="checkPromo">Проверить</button>
        <span v-if="promo?.valid" class="chip">скидка ${{ Number(promo.discount).toFixed(2) }}</span>
      </div>

      <h3>3. Адрес</h3>
      <div class="addr">
        <input v-model="address.line1" placeholder="Улица, дом" />
        <input v-model="address.line2" placeholder="Квартира (опц.)" />
        <input v-model="address.city" placeholder="Город" />
        <input v-model="address.zip" placeholder="Индекс" />
        <input v-model="address.country" placeholder="US" maxlength="2" />
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <div class="total">
        <span>Товары: ${{ Number(cart.subtotal).toFixed(2) }} · доставка: ${{ Number(shippingPrice).toFixed(2) }}</span>
        <strong>К оплате: ${{ Number(total).toFixed(2) }}</strong>
        <button class="primary" :disabled="!canPlace || placing" @click="place">{{ placing ? "Оформляем…" : "Подтвердить заказ" }}</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.wrap { background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 24px; }
h3 { margin: 14px 0 8px; }
.ship { display: block; padding: 6px 0; }
.promo { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.promo input { width: 300px; }
.chip { background: #2e7d32; color: #fff; border-radius: 12px; padding: 2px 10px; font-size: 13px; }
.addr { display: flex; flex-wrap: wrap; gap: 10px; }
.addr input { flex: 1 1 200px; }
.total { display: flex; justify-content: flex-end; align-items: center; gap: 16px; margin-top: 20px; }
</style>
