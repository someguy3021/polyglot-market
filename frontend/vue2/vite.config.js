import { defineConfig } from "vite";
import vue2 from "@vitejs/plugin-vue2";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 9001),
    strictPort: false,
  },
  plugins: [vue2()],
});
