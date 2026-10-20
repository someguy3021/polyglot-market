import Link from "next/link";
import { fetchCatalog, money } from "@/lib/server-api";

// RSC: каталог читается на сервере напрямую (revalidate 0 — всегда свежий)
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] ?? "" : v ?? ""]),
  );
  const catalog = await fetchCatalog(flat);

  return (
    <>
      <form className="filters" style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input name="q" placeholder="Поиск по названию" defaultValue={flat.q} style={{ flex: "1 1 260px" }} />
        <select name="category" defaultValue={flat.category}>
          <option value="">Все категории</option>
        </select>
        <select name="sort" defaultValue={flat.sort ?? "newest"}>
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="price_asc">Дешевле</option>
          <option value="price_desc">Дороже</option>
        </select>
        <button type="submit">Применить</button>
      </form>

      <div className="grid">
        {catalog.data.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card">
              <img src={p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? ""} alt={p.title} />
              <div className="body">
                <div className="title">{p.title}</div>
                <div className="meta">{p.category.name} · {p.seller.shopName}</div>
                <div className="price">{money(p.price)}</div>
              </div>
              <div style={{ padding: "0 12px 10px" }}>
                <span className="stock" style={p.stock <= 0 ? { color: "#999" } : undefined}>
                  {p.stock > 0 ? `в наличии: ${p.stock}` : "нет"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p style={{ color: "#888" }}>
        Страница {catalog.meta.currentPage} из {catalog.meta.lastPage} (пагинация — на флагмане)
      </p>
    </>
  );
}
