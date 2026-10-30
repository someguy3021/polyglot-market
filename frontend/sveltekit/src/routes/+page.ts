import { api } from '$shared/api';

// SSR + клиент: load исполняется на сервере (абсолютный API_URL из env) и на клиенте
export const load = async ({ url }) => {
  const q = url.searchParams;
  const res = await api.catalog.listProducts(
    Number(q.get('page') ?? 1),
    20,
    q.get('category') ?? undefined,
    undefined,
    q.get('q') ?? undefined,
    q.get('price_min') ? Number(q.get('price_min')) : undefined,
    q.get('price_max') ? Number(q.get('price_max')) : undefined,
    (q.get('sort') as 'newest' | 'oldest' | 'price_asc' | 'price_desc') ?? 'newest'
  );
  const cats = await api.catalog.listCategories();
  return { products: res.data.data, meta: res.data.meta, categories: cats.data.data };
};
