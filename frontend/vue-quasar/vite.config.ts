import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 9000),
    strictPort: false,
  },
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({ sassVariables: false }),
  ],
});
