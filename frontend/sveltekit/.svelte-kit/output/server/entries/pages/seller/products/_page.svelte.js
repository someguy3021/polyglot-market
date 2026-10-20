import { e as ensure_array_like, c as escape_html } from "../../../../chunks/index.js";
import "../../../../chunks/api.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let products = [];
    const labels = {
      draft: "черновик",
      pending_moderation: "на модерации",
      approved: "в продаже",
      rejected: "отклонён"
    };
    $$renderer2.push(`<div class="wrap svelte-1sz7f0j"><h1>Мои товары</h1> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <table class="svelte-1sz7f0j"><thead><tr><th class="svelte-1sz7f0j">Товар</th><th class="svelte-1sz7f0j">Цена</th><th class="svelte-1sz7f0j">Остаток</th><th class="svelte-1sz7f0j">Статус</th><th class="svelte-1sz7f0j">Действия</th></tr></thead><tbody><!--[-->`);
    const each_array = ensure_array_like(products);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let p = each_array[$$index];
      $$renderer2.push(`<tr><td class="svelte-1sz7f0j">${escape_html(p.title)}</td><td class="svelte-1sz7f0j">$${escape_html({ v: p.price }.v.toFixed(2))}</td><td class="svelte-1sz7f0j">${escape_html(p.stock)}</td><td class="svelte-1sz7f0j">${escape_html(labels[p.status] ?? p.status)}${escape_html(p.rejectionReason ? ` — ${p.rejectionReason}` : "")}</td><td class="svelte-1sz7f0j">`);
      if (["draft", "rejected"].includes(p.status)) {
        $$renderer2.push(`<!--[0--><button class="svelte-1sz7f0j">На модерацию</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (["draft", "approved"].includes(p.status)) {
        $$renderer2.push(`<!--[0--><input type="file" accept="image/png,image/jpeg,image/webp"/>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></td></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div>`);
  });
}
export {
  _page as default
};
