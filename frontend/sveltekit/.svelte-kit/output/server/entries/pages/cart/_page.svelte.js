import { e as ensure_array_like, a as attr, c as escape_html } from "../../../chunks/index.js";
import "../../../chunks/api.js";
import { c as cart } from "../../../chunks/session.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const image = (item) => item.product.images?.find((x) => x.isPrimary)?.url ?? item.product.images?.[0]?.url ?? "";
    $$renderer2.push(`<div class="wrap svelte-k7hhd7"><h1>Корзина</h1> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (cart.items.length === 0) {
      $$renderer2.push(`<!--[0--><p>Корзина пуста. <a href="/">К каталогу</a></p>`);
    } else {
      $$renderer2.push(`<!--[-1--><!--[-->`);
      const each_array = ensure_array_like(cart.items);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer2.push(`<div class="row svelte-k7hhd7"><img${attr("src", image(item))} alt="" class="svelte-k7hhd7"/> <div class="info svelte-k7hhd7"><div>${escape_html(item.product.title)}</div> <div class="meta svelte-k7hhd7">$${escape_html(Number(item.product.price).toFixed(2))} × ${escape_html(item.quantity)} = $${escape_html(Number(item.lineTotal).toFixed(2))}</div></div> <div class="controls svelte-k7hhd7"><button class="svelte-k7hhd7">−</button> <span>${escape_html(item.quantity)}</span> <button class="svelte-k7hhd7">+</button> <button class="del svelte-k7hhd7">✕</button></div></div>`);
      }
      $$renderer2.push(`<!--]--> <div class="total svelte-k7hhd7"><span>Итого: $${escape_html(Number(cart.subtotal).toFixed(2))}</span> <a href="/checkout"><button class="svelte-k7hhd7">Оформить заказ</button></a></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
