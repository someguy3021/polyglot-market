import { Component, inject, signal } from "@angular/core";
import { SessionService, errorMessage } from "../shared/session.service";

interface SellerProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: string;
  rejectionReason: string | null;
}

@Component({
  selector: "app-seller",
  standalone: true,
  template: `
    <h1>Мои товары</h1>
    @if (error()) { <div class="error">{{ error() }}</div> }
    <table>
      <thead><tr><th>Товар</th><th>Цена</th><th>Остаток</th><th>Статус</th><th>Действия</th></tr></thead>
      <tbody>
        @for (p of products(); track p.id) {
          <tr>
            <td>{{ p.title }}</td>
            <td>{{ '$' + p.price.toFixed(2) }}</td>
            <td>{{ p.stock }}</td>
            <td>
              <span class="chip" [style.background]="colors[p.status]">{{ labels[p.status] ?? p.status }}</span>
              @if (p.rejectionReason) { <div class="error">{{ p.rejectionReason }}</div> }
            </td>
            <td>
              @if (["draft", "rejected"].includes(p.status)) {
                <button (click)="submit(p.id)">На модерацию</button>
              }
              @if (["draft", "approved"].includes(p.status)) {
                <input type="file" accept="image/png,image/jpeg,image/webp" (change)="upload(p.id, $event)" />
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    .chip { color: #fff; border-radius: 12px; padding: 2px 10px; font-size: 12px; }
    .error { color: #c62828; font-size: 12px; }
    button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
  `,
})
export class SellerComponent {
  private session = inject(SessionService);
  products = signal<SellerProduct[]>([]);
  error = signal("");
  labels: Record<string, string> = { draft: "черновик", pending_moderation: "на модерации", approved: "в продаже", rejected: "отклонён" };
  colors: Record<string, string> = { draft: "#757575", pending_moderation: "#b26a00", approved: "#2e7d32", rejected: "#c62828" };

  constructor() {
    void this.load();
  }

  async load() {
    const res = await this.session.api.seller.listSellerProducts(1, 50);
    this.products.set(res.data.data as never);
  }

  async submit(id: string) {
    try {
      await this.session.api.seller.submitSellerProduct(id);
      await this.load();
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }

  async upload(id: string, event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await this.session.api.seller.uploadProductImage(id, file);
      await this.load();
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }
}
