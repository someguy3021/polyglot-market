<template>
  <q-page padding class="container narrow">
    <q-card flat bordered class="q-pa-xl">
      <div class="text-h5 q-mb-md">{{ isRegister ? "Регистрация" : "Вход" }}</div>

      <q-form class="q-gutter-md" @submit.prevent="submit">
        <q-input v-if="isRegister" v-model="form.name" outlined label="Имя" :rules="[req]" />
        <q-input v-model="form.email" outlined type="email" label="Email" :rules="[req]" />
        <q-input v-model="form.password" outlined type="password" label="Пароль" :rules="[req, (v: string) => !isRegister || v.length >= 8 || 'минимум 8 символов']" />

        <div class="row items-center q-gutter-sm">
          <q-btn color="primary" type="submit" :label="isRegister ? 'Создать аккаунт' : 'Войти'" :loading="busy" />
          <router-link v-if="!isRegister" to="/register">Создать аккаунт</router-link>
          <router-link v-else to="/login">Уже есть аккаунт — войти</router-link>
        </div>

        <div class="text-caption text-grey-7">
          Демо-аккаунты (сид): buyer@demo.dev, seller@demo.dev, moderator@demo.dev, admin@demo.dev — пароль «password».
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { errorMessage } from "../shared/api/client";
import { useSession } from "../shared/stores/session";
import { useCart } from "../shared/stores/cart";

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const session = useSession();
const cart = useCart();

const isRegister = computed(() => route.name === "register");
const busy = ref(false);
const form = reactive({ name: "", email: "", password: "" });

const req = (v: string) => Boolean(v) || "обязательное поле";

async function submit() {
  busy.value = true;
  try {
    if (isRegister.value) {
      await session.register(form.name, form.email, form.password);
    } else {
      await session.login(form.email, form.password);
    }
    await cart.reload();
    $q.notify({ type: "positive", message: `Добро пожаловать, ${session.user?.name}` });
    void router.push((route.query.next as string) ?? "/");
  } catch (err) {
    $q.notify({ type: "negative", message: errorMessage(err) });
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.container { max-width: 460px; margin: 40px auto 0; }
</style>
