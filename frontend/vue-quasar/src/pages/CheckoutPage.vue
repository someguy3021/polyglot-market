<template>
  <q-page padding class="container">
    <div class="text-h5 q-mb-md">Оформление заказа</div>

    <q-banner v-if="!cart.cart || cart.cart.items.length === 0" class="bg-grey-2">
      Корзина пуста. <router-link to="/">К каталогу</router-link>
    </q-banner>

    <q-card v-else flat bordered class="q-pa-lg">
      <div class="text-subtitle1 q-mb-sm">1. Доставка</div>
      <q-list bordered separator class="q-mb-lg">
        <q-item v-for="method in shipping" :key="method.code" tag="label" v-ripple>
          <q-item-section avatar>
            <q-radio v-model="form.shippingMethodCode" :val="method.code" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ method.name }}</q-item-label>
            <q-item-label caption>${{ method.price.toFixed(2) }} · {{ method.etaDays }} дн.</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div class="text-subtitle1 q-mb-sm">2. Промокод</div>
      <div class="row items-center q-gutter-sm q-mb-lg">
        <q-input v-model="form.promoCode" dense outlined label="Промокод (например WELCOME10)" style="width: 320px" />
        <q-btn flat label="Проверить" :loading="checkingPromo" @click="checkPromo" />
        <q-badge v-if="promo" color="green-8">скидка ${{ promo.discount.toFixed(2) }}</q-badge>
      </div>

      <div class="text-subtitle1 q-mb-sm">3. Адрес</div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6"><q-input v-model="form.shippingAddress.line1" outlined dense label="Улица, дом" /></div>
        <div class="col-12 col-md-6"><q-input v-model="form.shippingAddress.line2" outlined dense label="Квартира (опц.)" /></div>
        <div class="col-6 col-md-4"><q-input v-model="form.shippingAddress.city" outlined dense label="Город" /></div>
        <div class="col-6 col-md-4"><q-input v-model="form.shippingAddress.zip" outlined dense label="Индекс" /></div>
        <div class="col-6 col-md-4"><q-input v-model="form.shippingAddress.country" outlined dense label="Страна (US, DE…)" maxlength="2" /></div>
      </div>

      <q-separator class="q-my-lg" />

      <div class="row justify-end items-center q-gutter-md">
        <div class="text-body1 text-grey-7">
          Товары: ${{ cart.subtotal.toFixed(2) }}
          <template v-if="promo && promo.valid"> · скидка: −${{ promo.discount.toFixed(2) }}</template>
          · доставка: ${{ shippingPrice.toFixed(2) }}
        </div>
        <div class="text-h6">К оплате: ${{ total.toFixed(2) }}</div>
        <q-btn
          color="primary"
          size="lg"
          label="Подтвердить заказ"
          :loading="placing"
          :disable="!canPlace"
          @click="placeOrder"
        />
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api, call, errorMessage, setOrderIdempotencyKey } from "../api/client";
import { useCart } from "../stores/cart";

interface ShippingMethod { code: string; name: string; price: number; etaDays: number }
interface PromoView { code: string; valid: boolean; discount: number }

const router = useRouter();
const $q = useQuasar();
const cart = useCart();

const shipping = ref<ShippingMethod[]>([]);
const promo = ref<PromoView | null>(null);
const checkingPromo = ref(false);
const placing = ref(false);

const form = reactive({
  shippingMethodCode: "",
  promoCode: "",
  shippingAddress: { line1: "", line2: "", city: "", zip: "", country: "US" },
});

const shippingPrice = computed(
  () => shipping.value.find((m) => m.code === form.shippingMethodCode)?.price ?? 0,
);
const total = computed(() => Math.max(0, cart.subtotal - (promo.value?.discount ?? 0)) + shippingPrice.value);
const canPlace = computed(
  () =>
    cart.cart !== null &&
    cart.cart.items.length > 0 &&
    form.shippingMethodCode !== "" &&
    form.shippingAddress.line1 !== "" &&
    form.shippingAddress.city !== "" &&
    form.shippingAddress.zip !== "" &&
    form.shippingAddress.country !== "",
);

async function checkPromo() {
  if (!form.promoCode) return;
  checkingPromo.value = true;
  try {
    promo.value = (await call(
      api.orders.validatePromo({ code: form.promoCode, subtotal: cart.subtotal }),
    )) as PromoView;
    if (!promo.value.valid) {
      $q.notify({ type: "warning", message: "Промокод не применим" });
      promo.value = null;
    }
  } catch (err) {
    promo.value = null;
    $q.notify({ type: "negative", message: errorMessage(err) });
  } finally {
    checkingPromo.value = false;
  }
}

async function placeOrder() {
  placing.value = true;
  // Идемпотентность (ADR-011): ключ на попытку — повторный клик не создаст дубликат
  const idemKey = crypto.randomUUID();
  setOrderIdempotencyKey(idemKey);
  try {
    const order = await call(api.orders.createOrder(idemKey, {
      shippingMethodCode: form.shippingMethodCode,
      promoCode: promo.value?.valid ? form.promoCode || undefined : undefined,
      shippingAddress: {
        line1: form.shippingAddress.line1,
        line2: form.shippingAddress.line2 || undefined,
        city: form.shippingAddress.city,
        zip: form.shippingAddress.zip,
        country: form.shippingAddress.country.toUpperCase(),
      },
    }));
    setOrderIdempotencyKey(undefined);
    await cart.load();
    $q.notify({ type: "positive", message: `Заказ ${(order as { id: string }).id.slice(0, 8)}… оформлен` });
    void router.push("/orders");
  } catch (err) {
    setOrderIdempotencyKey(undefined);
    $q.notify({ type: "negative", message: errorMessage(err) });
  } finally {
    placing.value = false;
  }
}

onMounted(async () => {
  cart.load();
  try {
    const body = await call(api.orders.listShippingMethods());
    shipping.value = body.data as ShippingMethod[];
    if (shipping.value.length > 0) form.shippingMethodCode = shipping.value[0]!.code;
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  }
});
</script>

<style scoped>
.container { max-width: 900px; margin: 0 auto; }
</style>
