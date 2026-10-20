export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
    },
  },
  devServer: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 3002),
  },
  // SDK-пакет — workspace-зависимость: даём Nuxt его транспилировать
  build: {
    transpile: ["@showcase/api-client"],
  },
});
