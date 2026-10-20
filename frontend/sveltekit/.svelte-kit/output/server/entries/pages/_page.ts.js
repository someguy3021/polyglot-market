import { a as api } from "../../chunks/api.js";
const load = async ({ url }) => {
  const q = url.searchParams;
  const res = await api.catalog.listProducts(
    Number(q.get("page") ?? 1),
    20,
    q.get("category") ?? void 0,
    void 0,
    q.get("q") ?? void 0,
    q.get("price_min") ? Number(q.get("price_min")) : void 0,
    q.get("price_max") ? Number(q.get("price_max")) : void 0,
    q.get("sort") ?? "newest"
  );
  const cats = await api.catalog.listCategories();
  return { products: res.data.data, meta: res.data.meta, categories: cats.data.data };
};
export {
  load
};
