import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { SessionService, errorMessage } from "../session.service";

interface ShippingMethod { code: string; name: string; price: number; etaDays: number }

@Component({
  selector: "app-checkout",
  standalone: true,
  template: `
    <div class="wrap">
      <h1>Оформление заказа</h1>
      @if (session.cart().items.length === 0) {
        <p>Корзина пуста. <a href="/">К каталогу</a></p>
      } @else {
        <h3>1. Доставка</h3>
        @for (m of shipping(); track m.code) {
          <label>
            <input type="radio" name="method" [checked]="method() === m.code" (change)="method.set(m.code)" />
            {{ m.name }} — \${{ m.price.toFixed(2) }} · {{ m.etaDays }} дн.
          </label>
        }

        <h3>2. Промокод</h3>
        <div class="promo">
          <input placeholder="Промокод (например WELCOME10)" [value]="promoCode()" (input)="promoCode.set($any($event.target).value)" />
          <button (click)="checkPromo()">Проверить</button>
          @if (promo(); as p) { <span class="chip">скидка \${{ p.discount.toFixed(2) }}</span> }
        </div>

        <h3>3. Адрес</h3>
        <div class="addr">
          <input placeholder="Улица, дом" [value]="address().line1" (input)="set('line1', $event)" />
          <input placeholder="Квартира (опц.)" [value]="address().line2" (input)="set('line2', $event)" />
          <input placeholder="Город" [value]="address().city" (input)="set('city', $event)" />
          <input placeholder="Индекс" [value]="address().zip" (input)="set('zip', $event)" />
          <input placeholder="US" maxlength="2" [value]="address().country" (input)="set('country', $event)" />
        </div>

        @if (error()) { <div class="error">{{ error() }}</div> }

        <div class="total">
          <span>Товары: \${{ session.cart().subtotal.toFixed(2) }} · доставка: \${{ shippingPrice().toFixed(2) }}</span>
          <strong>К оплате: \${{ total().toFixed(2) }}</strong>
          <button [disabled]="!canPlace() || placing()" (click)="place()">
            {{ placing() ? 'Оформляем…' : 'Подтвердить заказ' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .wrap { background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 24px; max-width: 900px; margin: 0 auto; }
    h3 { margin: 14px 0 8px; }
    label { display: block; padding: 4px 0; }
    .promo { display: flex; gap: 10px; align-items: center; }
    .promo input { padding: 8px; border: 1px solid #ccc; border-radius: 6px; width: 300px; }
    .chip { background: #2e7d32; color: #fff; border-radius: 12px; padding: 2px 10px; font-size: 13px; }
    .addr { display: flex; flex-wrap: wrap; gap: 10px; }
    .addr input { padding: 8px; border: 1px solid #ccc; border-radius: 6px; flex: 1 1 200px; }
    .total { display: flex; justify-content: flex-end; align-items: center; gap: 16px; margin-top: 20px; }
    .total button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 12px 20px; cursor: pointer; font-size: 16px; }
    .total button:disabled { opacity: .5; }
    .error { color: #c62828; margin-top: 10px; }
  `,
})
export class CheckoutComponent {
  public session = inject(SessionService);
  private router = inject(Router);

  shipping = signal<ShippingMethod[]>([]);
  method = signal("");
  promoCode = signal("");
  promo = signal<{ valid: boolean; discount: number } | null>(null);
  error = signal("");
  placing = signal(false);
  address = signal({ line1: "", line2: "", city: "", zip: "", country: "US" });

  shippingPrice = signal(0);
  total = signal(0);
  canPlace = signal(false);

  constructor() {
    void (async () => {
      await this.session.loadCart();
      const res = await fetch("http://127.0.0.1:8000/shipping-methods");
      const body = await res.json();
      this.shipping.set(body.data);
      if (body.data.length) this.method.set(body.data[0].code);
      this.recalc();
    })();
  }

  recalc() {
    const price = this.shipping().find((m) => m.code === this.method())?.price ?? 0;
    this.shippingPrice.set(price);
    const discount = this.promo()?.valid ? this.promo()!.discount : 0;
    this.total.set(Math.max(0, this.session.cart().subtotal - discount) + price);
    const a = this.address();
    this.canPlace.set(this.session.cart().items.length > 0 && this.method() !== "" && a.line1 !== "" && a.city !== "" && a.zip !== "");
  }

  set(field: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.address.update((a) => ({ ...a, [field]: value }));
    this.recalc();
  }

  async checkPromo() {
    try {
      const res = await this.session.api.orders.validatePromo({ code: this.promoCode(), subtotal: this.session.cart().subtotal });
      const body = res.data as { valid: boolean; discount: number };
      this.promo.set(body.valid ? body : null);
      this.error.set("");
    } catch (err) {
      this.promo.set(null);
      this.error.set(errorMessage(err));
    }
    this.recalc();
  }

  async place() {
    this.placing.set(true);
    const key = crypto.randomUUID();
    this.session.setOrderIdempotencyKey(key);
    try {
      await this.session.api.orders.createOrder(key, {
        shippingMethodCode: this.method(),
        promoCode: this.promo()?.valid ? this.promoCode() || undefined : undefined,
        shippingAddress: {
          line1: this.address().line1,
          line2: this.address().line2 || undefined,
          city: this.address().city,
          zip: this.address().zip,
          country: this.address().country.toUpperCase(),
        },
      });
      this.session.setOrderIdempotencyKey(undefined);
      await this.session.loadCart();
      this.router.navigate(["/orders"]);
    } catch (err) {
      this.session.setOrderIdempotencyKey(undefined);
      this.error.set(errorMessage(err));
    } finally {
      this.placing.set(false);
    }
  }
}
