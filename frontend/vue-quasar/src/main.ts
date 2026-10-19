import { createApp } from "vue";
import { Quasar, Notify } from "quasar";
import { createPinia } from "pinia";
import "@quasar/extras/material-icons/material-icons.css";
import "quasar/dist/quasar.css";
import "./app.css";
import App from "./App.vue";
import { router } from "./router";

createApp(App).use(Quasar, { plugins: { Notify } }).use(createPinia()).use(router).mount("#app");
