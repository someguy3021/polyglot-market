import { e as ensure_array_like, c as escape_html, f as attr_style, h as stringify } from "../../../chunks/index.js";
import "../../../chunks/api.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let orders = [];
    const labels = {
      new: "новый",
      paid: "оплачен",
      shipped: "отправлен",
      done: "доставлен",
      cancelled: "отменён"
    };
    const colors = {
      new: "#1565c0",
      paid: "#b26a00",
      shipped: "#6a1b9a",
      done: "#2e7d32",
      cancelled: "#c62828"
    };
    $$renderer2.push(`<div class="wrap svelte-1c7g62i"><h1>Мои заказы</h1> <!--[-->`);
    const each_array = ensure_array_like(orders);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let o = each_array[$$index_1];
      $$renderer2.push(`<div class="card svelte-1c7g62i"><div class="head svelte-1c7g62i"><div>Заказ #${escape_html(o.id.slice(0, 8))}… <span class="chip svelte-1c7g62i"${attr_style(`background: ${stringify(colors[o.status] ?? "#999")}`)}>${escape_html(labels[o.status] ?? o.status)}</span></div> <strong>$${escape_html(Number(o.total).toFixed(2))}</strong></div> <div class="meta svelte-1c7g62i">${escape_html(new Date(o.createdAt).toLocaleString("ru"))} · ${escape_html(o.shippingMethod.name)}</div> <!--[-->`);
      const each_array_1 = ensure_array_like(o.items);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let i = each_array_1[$$index];
        $$renderer2.push(`<div class="item svelte-1c7g62i">${escape_html(i.title)} × ${escape_html(i.quantity)} — $${escape_html(Number(i.price).toFixed(2))}</div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
