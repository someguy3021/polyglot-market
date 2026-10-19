<template>
  <q-page padding class="container">
    <div class="text-h5 q-mb-md">Корзина</div>

    <q-banner v-if="!cart.cart || cart.cart.items.length === 0" class="bg-grey-2">
      Корзина пуста. <router-link to="/">К каталогу</router-link>
    </q-banner>

    <q-list v-else bordered separator class="bg-white">
      <q-item v-for="item in cart.cart.items" :key="item.id" class="q-py-md">
        <q-item-section avatar>
          <q-img :src="item.product.image ?? ''" style="width: 72px; height: 56px; border-radius: 6px" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ item.product.title }}</q-item-label>
          <q-item-label caption>${{ item.product.price.toFixed(2) }} × {{ item.quantity }} = ${{ item.lineTotal.toFixed(2) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row items-center q-gutter-sm">
            <q-btn dense round flat icon="remove" :disable="item.quantity <= 1" @click="changeQty(item, item.quantity - 1)" />
            <span>{{ item.quantity }}</span>
            <q-btn dense round flat icon="add" @click="changeQty(item, item.quantity + 1)" />
            <q-btn dense round flat color="red" icon="delete" @click="removeItem(item.id)" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <div v-if="cart.cart && cart.cart.items.length > 0" class="row justify-end items-center q-mt-md q-gutter-md">
      <div class="text-h6">Итого: ${{ cart.subtotal.toFixed(2) }}</div>
      <q-btn color="primary" size="lg" label="Оформить заказ" to="/checkout" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useQuasar } from "quasar";
import { errorMessage } from "../api/client";
import { useCart, type CartItemView } from "../stores/cart";

const $q = useQuasar();
const cart = useCart();

async function changeQty(item: CartItemView, quantity: number) {
  try {
    await cart.setQuantity(item.id, quantity);
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  }
}

async function removeItem(itemId: string) {
  try {
    await cart.remove(itemId);
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  }
}

onMounted(() => cart.load());
</script>

<style scoped>
.container { max-width: 900px; margin: 0 auto; }
</style>
