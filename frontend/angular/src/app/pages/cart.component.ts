import { Component, inject, signal } from "@angular/core";
import { SessionService, errorMessage } from "../session.service";

@Component({
  selector: "app-cart",
  standalone: true,
  template: `
    <h1>Корзина</h1>
    @if (error()) { <div class="error">{{ error() }}</div> }
    @if (session.cart().items.length === 0) {
      <p>Корзина пуста. <a href="/">К каталогу</a></p>
    } @else {
      @for (item of session.cart().items; track item.id) {
        <div class="row">
          <img [src]="image(item)" alt="" />
          <div class="info">
            <div>{{ item.product.title }}</div>
            <div class="meta">\${{ item.product.price.toFixed(2) }} × {{ item.quantity }} = \${{ item.lineTotal.toFixed(2) }}</div>
          </div>
          <div class="controls">
            <button (click)="setQty(item, item.quantity - 1)">−</button>
            <span>{{ item.quantity }}</span>
            <button (click)="setQty(item, item.quantity + 1)">+</button>
            <button class="del" (click)="remove(item.id)">✕</button>
          </div>
        </div>
      }
      <div class="total">
        <span>Итого: \${{ session.cart().subtotal.toFixed(2) }}</span>
        <a href="/checkout"><button>Оформить заказ</button></a>
      </div>
    }
  `,
  styles: `
    .row { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; }
    .row img { width: 72px; height: 56px; object-fit: cover; border-radius: 6px; }
    .info { flex: 1; }
    .meta { color: #777; font-size: 13px; }
    .controls { display: flex; align-items: center; gap: 8px; }
    .controls button { border: 1px solid #ccc; background: #fff; border-radius: 6px; width: 30px; height: 30px; cursor: pointer; }
    .controls .del { color: #c62828; }
    .total { display: flex; justify-content: flex-end; align-items: center; gap: 16px; font-size: 20px; font-weight: 700; }
    .error { color: #c62828; }
  `,
})
export class CartComponent {
  public session = inject(SessionService);
  error = signal("");

  constructor() {
    // при прямой загрузке /cart сигнал сессии пуст — тянем корзину с сервера
    void this.session.loadCart();
  }

  image(item: any): string {
    return item.product.images?.find((x: any) => x.isPrimary)?.url ?? item.product.images?.[0]?.url ?? "";
  }

  async setQty(item: any, quantity: number) {
    if (quantity < 1) return;
    try {
      await this.session.api.cart.updateCartItem(item.id, { quantity });
      await this.session.loadCart();
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }

  async remove(itemId: string) {
    try {
      await this.session.api.cart.deleteCartItem(itemId);
      await this.session.loadCart();
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }
}
