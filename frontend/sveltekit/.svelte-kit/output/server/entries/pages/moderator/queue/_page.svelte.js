import { e as ensure_array_like, c as escape_html } from "../../../../chunks/index.js";
import "../../../../chunks/api.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let queue = [];
    $$renderer2.push(`<div class="wrap svelte-1vempo"><h1>Очередь модерации</h1> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <table class="svelte-1vempo"><thead><tr><th class="svelte-1vempo">Товар</th><th class="svelte-1vempo">Цена</th><th class="svelte-1vempo">Продавец</th><th class="svelte-1vempo">Решение</th></tr></thead><tbody>`);
    const each_array = ensure_array_like(queue);
    if (each_array.length !== 0) {
      $$renderer2.push("<!--[-->");
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let p = each_array[$$index];
        $$renderer2.push(`<tr><td class="svelte-1vempo">${escape_html(p.title)}</td><td class="svelte-1vempo">$${escape_html({ v: p.price }.v.toFixed(2))}</td><td class="svelte-1vempo">${escape_html(p.seller.shopName)}</td><td class="svelte-1vempo"><button class="ok svelte-1vempo">Одобрить</button> <button class="bad svelte-1vempo">Отклонить</button></td></tr>`);
      }
    } else {
      $$renderer2.push(`<!--[!--><tr><td colspan="4" class="svelte-1vempo">Очередь пуста</td></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
