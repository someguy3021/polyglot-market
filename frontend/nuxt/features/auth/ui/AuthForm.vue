<script setup lang="ts">
const props = defineProps<{ mode: "login" | "register" }>();

const form = reactive({ name: "", email: "", password: "" });
const busy = ref(false);
const error = ref("");

async function submit() {
  busy.value = true;
  error.value = "";
  try {
    if (props.mode === "register") {
      await register(form.name, form.email, form.password);
    } else {
      await login(form.email, form.password);
    }
    navigateTo("/");
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="wrap">
    <h1>{{ mode === "register" ? "Регистрация" : "Вход" }}</h1>
    <input v-if="mode === 'register'" v-model="form.name" placeholder="Имя" />
    <input v-model="form.email" type="email" placeholder="Email" />
    <input v-model="form.password" type="password" placeholder="Пароль" />
    <div v-if="error" class="error">{{ error }}</div>
    <button class="primary" :disabled="busy" @click="submit">
      {{ mode === "register" ? "Создать аккаунт" : "Войти" }}
    </button>
    <p class="demo">Демо: buyer@demo.dev, seller@demo.dev, moderator@demo.dev, admin@demo.dev — пароль «password»</p>
  </div>
</template>

<style scoped>
.wrap { max-width: 420px; margin: 48px auto 0; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 28px; display: flex; flex-direction: column; gap: 12px; }
input { padding: 10px; }
button { padding: 10px; }
.error { color: #c62828; }
.demo { color: #777; font-size: 12px; }
</style>
