import { g as getContext, a as attr, e as ensure_array_like, b as attr_class, s as store_get, c as escape_html, u as unsubscribe_stores } from "../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
import { s as session } from "../../chunks/session.svelte.js";
const getStores = () => {
  const stores = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children } = $$props;
    const links = [
      { href: "/", label: "Каталог", show: true },
      { href: "/cart", label: "Корзина", show: true },
      {
        href: "/orders",
        label: "Заказы",
        show: Boolean(session.user)
      },
      {
        href: "/seller/products",
        label: "Мои товары",
        show: session.user?.role === "seller"
      },
      {
        href: "/moderator/queue",
        label: "Модерация",
        show: session.user?.role === "moderator" || session.user?.role === "admin"
      },
      {
        href: "/admin/orders",
        label: "Админ",
        show: session.user?.role === "admin"
      }
    ];
    $$renderer2.push(`<div class="app svelte-12qhfyh"><header class="svelte-12qhfyh"><span class="brand svelte-12qhfyh" role="button"${attr("tabindex", 0)}>Polyglot Market</span> <nav class="svelte-12qhfyh"><!--[-->`);
    const each_array = ensure_array_like(links);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let link = each_array[$$index];
      if (link.show) {
        $$renderer2.push(`<!--[0--><a${attr("href", link.href)}${attr_class("svelte-12qhfyh", void 0, {
          "active": store_get($$store_subs ??= {}, "$page", page).url.pathname === link.href
        })}>${escape_html(link.label)}</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> `);
    if (session.user) {
      $$renderer2.push(`<!--[0--><span class="role svelte-12qhfyh">${escape_html(session.user.role)}</span> <button class="svelte-12qhfyh">Выйти</button>`);
    } else {
      $$renderer2.push(`<!--[-1--><a href="/login"${attr_class("svelte-12qhfyh", void 0, {
        "active": store_get($$store_subs ??= {}, "$page", page).url.pathname === "/login"
      })}>Войти</a> <a href="/register" class="svelte-12qhfyh">Регистрация</a>`);
    }
    $$renderer2.push(`<!--]--></nav></header> <main class="svelte-12qhfyh">`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></main> <footer class="svelte-12qhfyh">Polyglot Market — SvelteKit (Svelte 5 runes) · демо: buyer@demo.dev / password</footer></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
