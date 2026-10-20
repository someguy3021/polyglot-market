import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SDK — workspace-пакет с исходниками: транслируем
  transpilePackages: ["@showcase/api-client"],
};

export default nextConfig;
