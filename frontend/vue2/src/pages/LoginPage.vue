<template>
  <div style="max-width: 460px; margin: 40px auto 0">
    <v-card class="pa-8">
      <div class="text-h5 mb-4">{{ isRegister ? "Регистрация" : "Вход" }}</div>
      <v-text-field v-model="form.name" v-if="isRegister" outlined label="Имя" />
      <v-text-field v-model="form.email" outlined label="Email" type="email" class="mb-2" />
      <v-text-field v-model="form.password" outlined label="Пароль" type="password" :hint="isRegister ? 'минимум 8 символов' : undefined" />
      <div v-if="error" class="red--text mb-2">{{ error }}</div>
      <v-btn color="primary" block :loading="busy" @click="submit">
        {{ isRegister ? "Создать аккаунт" : "Войти" }}
      </v-btn>
      <div class="text-caption grey--text mt-4">
        Демо-аккаунты: buyer@demo.dev, seller@demo.dev, moderator@demo.dev, admin@demo.dev — пароль «password».
      </div>
    </v-card>
  </div>
</template>

<script>
import { errorMessage } from "../api";

export default {
  name: "LoginPage",
  data: () => ({ form: { name: "", email: "", password: "" }, busy: false, error: "" }),
  computed: {
    isRegister() {
      return this.$route.meta.register === true;
    },
  },
  methods: {
    async submit() {
      this.busy = true;
      this.error = "";
      try {
        if (this.isRegister) {
          await this.$store.dispatch("register", { ...this.form });
        } else {
          await this.$store.dispatch("login", { email: this.form.email, password: this.form.password });
        }
        await this.$store.dispatch("loadCart");
        this.$router.push(this.$route.query.next || "/");
      } catch (err) {
        this.error = errorMessage(err);
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>
