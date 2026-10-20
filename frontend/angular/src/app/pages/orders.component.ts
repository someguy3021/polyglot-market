import { DatePipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { SessionService, errorMessage } from "../session.service";

interface OrderView {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  shippingMethod: { name: string };
  items: Array<{ id: string; title: string; quantity: number; price: number }>;
}

@Component({
  selector: "app-orders",
  standalone: true,
  imports: [DatePipe],
  template: `
    <h1>Мои заказы</h1>
    @for (o of orders(); track o.id) {
      <div class="card">
        <div class="head">
          <span>Заказ #{{ o.id.slice(0, 8) }}… <span class="chip" [style.background]="colors[o.status]">{{ labels[o.status] ?? o.status }}</span></span>
          <strong>\${{ o.total.toFixed(2) }}</strong>
        </div>
        <div class="meta">{{ o.createdAt | date:'dd.MM.yyyy HH:mm' }} · {{ o.shippingMethod.name }}</div>
        @for (i of o.items; track i.id) {
          <div class="item">{{ i.title }} × {{ i.quantity }} — \${{ i.price.toFixed(2) }}</div>
        }
      </div>
    } @empty {
      <p>Заказов пока нет. <a href="/">К каталогу</a></p>
    }
  `,
  styles: `
    .card { background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; }
    .head { display: flex; justify-content: space-between; align-items: center; font-size: 16px; }
    .chip { color: #fff; border-radius: 12px; padding: 2px 10px; font-size: 12px; }
    .meta { color: #777; font-size: 12px; margin: 4px 0; }
    .item { font-size: 14px; }
  `,
})
export class OrdersComponent {
  private session = inject(SessionService);
  orders = signal<OrderView[]>([]);
  labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };
  colors: Record<string, string> = { new: "#1565c0", paid: "#b26a00", shipped: "#6a1b9a", done: "#2e7d32", cancelled: "#c62828" };

  constructor() {
    this.session.api.orders.listMyOrders(1, 20).then((r) => this.orders.set(r.data.data));
  }
}

