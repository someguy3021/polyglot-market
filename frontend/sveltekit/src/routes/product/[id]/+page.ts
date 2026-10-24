import { api } from '$lib/api';

// SSR + клиент: товар грузится в load (абсолютный API_URL из env на сервере);
// без load у страницы нет data.id, а $effect на сервере не выполняется — страница
// навсегда оставалась в «Загрузке…».
export const load = async ({ params }) => {
  const res = await api.catalog.getProduct(params.id);
  // GET /products/{id} отдаёт товар напрямую, без обёртки { data }
  return { product: res.data };
};
