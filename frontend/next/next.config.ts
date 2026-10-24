import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SDK — workspace-пакет с исходниками: транслируем
  transpilePackages: ["@showcase/api-client"],
  // docker-runtime без node_modules: .next/standalone/server.js тянет всё нужное с собой
  output: "standalone",
};

export default nextConfig;
