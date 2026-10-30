import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    // FSD (ADR-014): $lib переехал в $shared (слой shared); routes остаются слоем pages
    alias: {
      $shared: "src/shared",
    },
  },
};

export default config;
