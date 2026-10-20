import { c as escape_html, a as attr } from "./index.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import "./session.svelte.js";
import "./api.js";
function AuthForm($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { mode = "login" } = $$props;
    let form = { name: "", email: "", password: "" };
    let busy = false;
    $$renderer2.push(`<div class="wrap svelte-b3lieb"><h1>${escape_html(mode === "register" ? "Регистрация" : "Вход")}</h1> `);
    if (mode === "register") {
      $$renderer2.push(`<!--[0--><input placeholder="Имя"${attr("value", form.name)} class="svelte-b3lieb"/>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <input placeholder="Email" type="email"${attr("value", form.email)} class="svelte-b3lieb"/> <input placeholder="Пароль" type="password"${attr("value", form.password)} class="svelte-b3lieb"/> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button${attr("disabled", busy, true)} class="svelte-b3lieb">${escape_html(mode === "register" ? "Создать аккаунт" : "Войти")}</button> <p class="demo svelte-b3lieb">Демо: buyer@demo.dev, seller@demo.dev, moderator@demo.dev, admin@demo.dev — пароль «password»</p></div>`);
  });
}
export {
  AuthForm as A
};
