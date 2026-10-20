// Точка входа Vue 2.7: Vuex + VueRouter + Vuetify (канон Vue 2, фича 12).
import Vue from "vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";
import "@mdi/font/css/materialdesignicons.css";
import App from "./App.vue";
import { store } from "./store";
import { router } from "./router";

Vue.use(Vuetify);

new Vue({
  store,
  router,
  vuetify: new Vuetify(),
  render: (h) => h(App),
}).$mount("#app");
