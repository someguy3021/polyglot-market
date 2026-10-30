import { Component, inject, signal } from "@angular/core";
import { SessionService, errorMessage } from "../shared/session.service";

interface AdminOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ id: string; title: string; quantity: number }>;
}

const TRANSITIONS: Record<string, string[]> = {
  new: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["done"],
  done: [],
  cancelled: [],
};
const labels: Record<string, string> = { new: "новый", paid: "оплачен", shipped: "отправлен", done: "доставлен", cancelled: "отменён" };

@Component({
  selector: "app-admin",
  standalone: true,
  template: `
    <h1>Админ — заказы</h1>
    @if (error()) { <div class="error">{{ error() }}</div> }
    <table>
      <thead><tr><th>Заказ</th><th>Позиции</th><th>Сумма</th><th>Статус →</th></tr></thead>
      <tbody>
        @for (o of orders(); track o.id) {
          <tr>
            <td>#{{ o.id.slice(0, 8) }}…</td>
            <td>
              @for (i of o.items; track i.id) {
                <div>{{ i.title }} × {{ i.quantity }}</div>
              }
            </td>
            <td>{{ '$' + o.total.toFixed(2) }}</td>
            <td>
              <select [value]="o.status" (change)="changeStatus(o.id, $any($event.target).value)">
                @for (s of [o.status].concat(transitions[o.status]); track s) {
                  <option [value]="s">{{ labelsMap[s] ?? s }}</option>
                }
              </select>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    select { padding: 6px; }
    .error { color: #c62828; }
  `,
})
export class AdminComponent {
  private session = inject(SessionService);
  orders = signal<AdminOrder[]>([]);
  error = signal("");
  readonly transitions = TRANSITIONS;
  readonly labelsMap = labels;

  constructor() {
    void this.load();
  }

  async load() {
    const res = await this.session.api.admin.listAllOrders(1, 50);
    this.orders.set(res.data.data);
  }

  async changeStatus(id: string, status: string) {
    try {
      await this.session.api.admin.updateOrderStatus(id, { status: status as never });
      await this.load();
    } catch (err) {
      this.error.set(errorMessage(err));
      await this.load();
    }
  }
}
