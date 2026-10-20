import { Component, inject, signal } from "@angular/core";
import { SessionService, errorMessage } from "../session.service";

@Component({
  selector: "app-moderator",
  standalone: true,
  template: `
    <h1>Очередь модерации</h1>
    @if (error()) { <div class="error">{{ error() }}</div> }
    <table>
      <thead><tr><th>Товар</th><th>Цена</th><th>Продавец</th><th>Решение</th></tr></thead>
      <tbody>
        @for (p of queue(); track p.id) {
          <tr>
            <td>{{ p.title }}</td>
            <td>{{ '$' + p.price.toFixed(2) }}</td>
            <td>{{ p.seller.shopName }}</td>
            <td>
              <button class="ok" (click)="approve(p.id)">Одобрить</button>
              <button class="bad" (click)="rejecting.set(p.id)">Отклонить</button>
            </td>
          </tr>
        } @empty {
          <tr><td colspan="4">Очередь пуста</td></tr>
        }
      </tbody>
    </table>
    @if (rejecting(); as id) {
      <div class="modal">
        <h3>Причина отклонения</h3>
        <textarea [value]="reason()" (input)="reason.set($any($event.target).value)"></textarea>
        <div class="row">
          <button (click)="rejecting.set(null)">Отмена</button>
          <button class="bad" (click)="reject()">Отклонить</button>
        </div>
      </div>
    }
  `,
  styles: `
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    .ok { background: #2e7d32; color: #fff; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; margin-right: 6px; }
    .bad { background: #c62828; color: #fff; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
    .modal { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .modal textarea { width: 380px; height: 120px; }
    .modal .row { display: flex; gap: 10px; margin-top: 10px; }
    .error { color: #c62828; }
  `,
})
export class ModeratorComponent {
  private session = inject(SessionService);
  queue = signal<Array<{ id: string; title: string; price: number; seller: { shopName: string } }>>([]);
  rejecting = signal<string | null>(null);
  reason = signal("");
  error = signal("");

  constructor() {
    void this.load();
  }

  async load() {
    const res = await this.session.api.moderation.moderationQueue(1, 50);
    this.queue.set(res.data.data as never);
  }

  async approve(id: string) {
    try {
      await this.session.api.moderation.approveProduct(id);
      await this.load();
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }

  async reject() {
    if (!this.rejecting()) return;
    try {
      await this.session.api.moderation.rejectProduct(this.rejecting()!, { reason: this.reason() });
      this.rejecting.set(null);
      this.reason.set("");
      await this.load();
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }
}
