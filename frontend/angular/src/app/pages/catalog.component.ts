import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { SessionService, errorMessage } from "../shared/session.service";

interface ProductCard {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: { name: string };
  seller: { shopName: string };
  images: Array<{ url: string; isPrimary: boolean }>;
}

@Component({
  selector: "app-catalog",
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="filters">
      <input placeholder="Поиск по названию" [value]="q()" (input)="onSearch($event)" />
      <select [value]="sort()" (change)="setSort($event)">
        <option value="newest">Сначала новые</option>
        <option value="oldest">Сначала старые</option>
        <option value="price_asc">Дешевле</option>
        <option value="price_desc">Дороже</option>
      </select>
    </div>
    @if (error()) { <div class="error">{{ error() }}</div> }
    <div class="grid">
      @for (p of products(); track p.id) {
        <div class="card" (click)="router.navigate(['/product', p.id])">
          <img [src]="image(p)" [alt]="p.title" />
          <div class="body">
            <div class="title">{{ p.title }}</div>
            <div class="meta">{{ p.category.name }} · {{ p.seller.shopName }}</div>
            <div class="price">\${{ p.price.toFixed(2) }}</div>
          </div>
          <div class="actions">
            <span class="stock" [class.out]="p.stock <= 0">{{ p.stock > 0 ? 'в наличии: ' + p.stock : 'нет' }}</span>
            <button [disabled]="p.stock <= 0" (click)="add($event, p.id)">В корзину</button>
          </div>
        </div>
      } @empty {
        <div class="grey">Ничего не найдено — смягчите фильтры.</div>
      }
    </div>
    @if (lastPage() > 1) {
      <div class="pager">
        @for (n of pages(); track n) {
          <button class="page" [class.current]="n === page()" (click)="load(n)">{{ n }}</button>
        }
      </div>
    }
  `,
  styles: `
    .filters { display: flex; gap: 10px; margin-bottom: 18px; }
    .filters input { flex: 1 1 260px; padding: 8px; border: 1px solid #ccc; border-radius: 6px; }
    .filters select { padding: 8px; border: 1px solid #ccc; border-radius: 6px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
    .card { background: #fff; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; cursor: pointer; }
    .card img { width: 100%; height: 180px; object-fit: cover; }
    .body { padding: 10px 12px; }
    .title { font-weight: 600; }
    .meta { color: #777; font-size: 12px; }
    .price { font-size: 18px; font-weight: 700; margin-top: 6px; }
    .actions { display: flex; justify-content: space-between; align-items: center; padding: 0 12px 10px; }
    .stock { font-size: 12px; color: #2e7d32; }
    .stock.out { color: #999; }
    .actions button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
    .grey { color: #888; }
    .error { color: #c62828; margin-bottom: 10px; }
    .pager { display: flex; gap: 6px; justify-content: center; margin-top: 20px; }
    .page { padding: 4px 10px; border: 1px solid #ccc; background: #fff; border-radius: 6px; cursor: pointer; }
    .page.current { background: #1f4a7a; color: #fff; }
  `,
})
export class CatalogComponent {
  private session = inject(SessionService);
  router = inject(Router);

  products = signal<ProductCard[]>([]);
  lastPage = signal(1);
  page = signal(1);
  q = signal("");
  sort = signal("newest");
  error = signal("");
  pages = signal<number[]>([]);

  constructor() {
    this.load();
  }

  onSearch(event: Event) {
    this.q.set((event.target as HTMLInputElement).value);
    setTimeout(() => this.load(1), 350);
  }

  setSort(event: Event) {
    this.sort.set((event.target as HTMLSelectElement).value);
    this.load(1);
  }

  image(p: ProductCard): string {
    return p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? "";
  }

  async add(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.error.set((await this.session.addToCart(id, 1)) ?? "");
  }

  async load(page = 1) {
    this.page.set(page);
    try {
      const res = await this.session.api.catalog.listProducts(
        page, 20, undefined, undefined,
        this.q() || undefined, undefined, undefined,
        this.sort() as never,
      );
      this.products.set(res.data.data as ProductCard[]);
      this.lastPage.set(res.data.meta.lastPage);
      this.pages.set(Array.from({ length: res.data.meta.lastPage }, (_, i) => i + 1));
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }
}
