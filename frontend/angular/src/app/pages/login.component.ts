import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { SessionService, errorMessage } from "../shared/session.service";

@Component({
  selector: "app-login",
  standalone: true,
  template: `
    <div class="wrap">
      <h1>{{ register() ? "Регистрация" : "Вход" }}</h1>
      @if (register()) { <input placeholder="Имя" [value]="form().name" (input)="set('name', $event)" /> }
      <input placeholder="Email" type="email" [value]="form().email" (input)="set('email', $event)" />
      <input placeholder="Пароль" type="password" [value]="form().password" (input)="set('password', $event)" />
      @if (error()) { <div class="error">{{ error() }}</div> }
      <button [disabled]="busy()" (click)="submit()">{{ register() ? "Создать аккаунт" : "Войти" }}</button>
      <p class="demo">Демо: buyer@demo.dev, seller@demo.dev, moderator@demo.dev, admin@demo.dev — пароль «password»</p>
    </div>
  `,
  styles: `
    .wrap { max-width: 420px; margin: 48px auto 0; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 28px; display: flex; flex-direction: column; gap: 12px; }
    input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; }
    button { background: #1f4a7a; color: #fff; border: none; border-radius: 6px; padding: 10px; cursor: pointer; }
    .error { color: #c62828; }
    .demo { color: #777; font-size: 12px; }
  `,
})
export class LoginComponent {
  private session = inject(SessionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  register = signal(this.route.snapshot.data["register"] === true);
  form = signal({ name: "", email: "", password: "" });
  busy = signal(false);
  error = signal("");

  set(field: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  async submit() {
    this.busy.set(true);
    try {
      const f = this.form();
      if (this.register()) await this.session.register(f.name, f.email, f.password);
      else await this.session.login(f.email, f.password);
      this.router.navigate(["/"]);
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
