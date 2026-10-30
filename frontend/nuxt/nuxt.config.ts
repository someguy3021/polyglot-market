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
  // FSD-слои (ADR-014): composables переехали в shared/{api,session},
  // форма логина — фича features/auth. Auto-import сканирует эти папки.
  imports: {
    dirs: ["shared/api", "shared/session"],
  },
  components: [
    { path: "~/features/auth/ui", pathPrefix: false },
  ],
  // SDK-пакет — workspace-зависимость: даём Nuxt его транспилировать
  build: {
    transpile: ["@showcase/api-client"],
  },
});
