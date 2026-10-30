import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { SessionService } from "./shared/session.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header>
      <span class="brand" (click)="router.navigate(['/'])">Polyglot Market
        @if (session.user(); as u) { <span class="role">{{ u.role }}</span> }
      </span>
      <nav>
        <a routerLink="/" routerLinkActive="active">Каталог</a>
        <a routerLink="/cart" routerLinkActive="active">Корзина @if (session.cart().count) { <b>({{ session.cart().count }})</b> }</a>
        @if (session.user(); as u) {
          @if (u.role === 'seller') { <a routerLink="/seller/products">Мои товары</a> }
          @if (u.role === 'moderator' || u.role === 'admin') { <a routerLink="/moderator/queue">Модерация</a> }
          @if (u.role === 'admin') { <a routerLink="/admin/orders">Админ</a> }
          <a routerLink="/orders">Заказы</a>
          <button class="ghost" (click)="session.logout()">Выйти</button>
        } @else {
          <a routerLink="/login">Войти</a>
          <a routerLink="/register">Регистрация</a>
        }
      </nav>
    </header>
    <main><router-outlet /></main>
    <footer>Polyglot Market — Angular (standalone + signals) · демо: buyer&#64;demo.dev / password</footer>
  `,
  styles: `
    header { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, #102a43, #1f4a7a); color: #fff; padding: 12px 28px; }
    .brand { font-weight: 700; font-size: 18px; cursor: pointer; }
    .role { border: 1px solid rgba(255,255,255,.5); border-radius: 10px; padding: 0 8px; font-size: 12px; }
    nav { display: flex; gap: 14px; align-items: center; }
    nav a { color: #fff; text-decoration: none; opacity: .85; }
    nav a.active { opacity: 1; border-bottom: 2px solid #d29922; }
    .ghost { background: transparent; border: none; color: #fff; cursor: pointer; }
    main { flex: 1; padding: 20px 28px; max-width: 1200px; margin: 0 auto; }
    footer { text-align: center; padding: 14px; color: #666; font-size: 13px; }
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    :host main { flex: 1; }
  `,
})
export class AppComponent {
  session = inject(SessionService);
  router = inject(Router);
}
