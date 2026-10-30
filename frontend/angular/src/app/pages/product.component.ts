import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { SessionService, errorMessage } from "../shared/session.service";

interface ProductView {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: { name: string };
  seller: { shopName: string };
  images: Array<{ id: string; url: string; thumbUrl: string | null; isPrimary: boolean }>;
}

@Component({
  selector: "app-product",
  standalone: true,
  template: `
    @if (product(); as p) {
      <div class="wrap">
        <div class="media">
          <img [src]="primary()" [alt]="p.title" />
          <div class="thumbs">
            @for (img of p.images; track img.id) {
              <img [src]="img.thumbUrl ?? img.url" [class.active]="img.url === primary()" (click)="current.set(img.url)" />
            }
          </div>
        </div>
        <div class="info">
          <h1>{{ p.title }}</h1>
          <p class="meta">{{ p.category.name }} · продает {{ p.seller.shopName }}</p>
          <p class="price">\${{ p.price.toFixed(2) }}</p>
          <p>{{ p.description }}</p>
          <span class="stock" [class.out]="p.stock <= 0">{{ p.stock > 0 ? 'в наличии: ' + p.stock : 'нет в наличии' }}</span>
          <div class="buy">
            <input type="number" [value]="qty()" (input)="qty.set(+$any($event.target).value)" />
            <button [disabled]="p.stock <= 0" (click)="add()">Добавить в корзину</button>
            @if (error()) { <span class="error">{{ error() }}</span> }
          </div>
        </div>
      </div>
    } @else {
      <p>Загрузка…</p>
    }
  `,
  styles: `
    .wrap { display: flex; gap: 28px; flex-wrap: wrap; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 24px; }
    .media { flex: 1 1 320px; }
    .media img { max-height: 420px; object-fit: contain; }
    .thumbs { display: flex; gap: 8px; margin-top: 10px; }
    .thumbs img { width: 72px; height: 56px; object-fit: cover; border-radius: 6px; cursor: pointer; }
    .thumbs img.active { outline: 2px solid #1f4a7a; }
    .info { flex: 1 1 320px; }
    .meta { color: #777; font-size: 13px; }
    .price { font-size: 32px; font-weight: 700; }
    .stock { font-size: 13px; color: #2e7d32; }
    .stock.out { color: #999; }
    .buy { display: flex; gap: 12px; align-items: center; margin-top: 24px; }
    .buy input { width: 80px; padding: 8px; }
    .buy button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 10px 16px; cursor: pointer; }
    .error { color: #c62828; }
  `,
})
export class ProductComponent {
  private session = inject(SessionService);
  private route = inject(ActivatedRoute);

  product = signal<ProductView | null>(null);
  current = signal("");
  qty = signal(1);
  error = signal("");

  primary = signal("");

  constructor() {
    this.route.params.subscribe(async (params) => {
      try {
        const res = await this.session.api.catalog.getProduct(params["id"]);
        this.product.set(res.data as ProductView);
        this.primary.set(this.imagePrimary(this.product()!));
      } catch (err) {
        this.error.set(errorMessage(err));
      }
    });
  }

  imagePrimary(p: ProductView): string {
    return p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? "";
  }

  async add() {
    this.error.set((await this.session.addToCart(this.product()!.id, this.qty())) ?? "");
  }
}
