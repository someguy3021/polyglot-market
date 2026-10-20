import { e as ensure_array_like, c as escape_html } from "../../../../chunks/index.js";
import { a as api, e as errorMessage } from "../../../../chunks/api.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let orders = [];
    let error = "";
    const transitions = {
      new: ["paid", "cancelled"],
      paid: ["shipped", "cancelled"],
      shipped: ["done"],
      done: [],
      cancelled: []
    };
    const labels = {
      new: "новый",
      paid: "оплачен",
      shipped: "отправлен",
      done: "доставлен",
      cancelled: "отменён"
    };
    async function load() {
      const res = await api.admin.listAllOrders(1, 50);
      orders = res.data.data;
    }
    async function changeStatus(id, status) {
      try {
        await api.admin.updateOrderStatus(id, { status });
        await load();
      } catch (e) {
        error = errorMessage(e);
        await load();
      }
    }
    $$renderer2.push(`<div class="wrap svelte-1ltwpmi"><h1>Админ — заказы</h1> `);
    if (error) {
      $$renderer2.push(`<!--[0--><div class="error svelte-1ltwpmi">${escape_html(error)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <table class="svelte-1ltwpmi"><thead><tr><th class="svelte-1ltwpmi">Заказ</th><th class="svelte-1ltwpmi">Позиции</th><th class="svelte-1ltwpmi">Сумма</th><th class="svelte-1ltwpmi">Статус →</th></tr></thead><tbody><!--[-->`);
    const each_array = ensure_array_like(orders);
    for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
      let o = each_array[$$index_2];
      $$renderer2.push(`<tr><td class="svelte-1ltwpmi">#${escape_html(o.id.slice(0, 8))}…</td><td class="svelte-1ltwpmi"><!--[-->`);
      const each_array_1 = ensure_array_like(o.items);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let i = each_array_1[$$index];
        $$renderer2.push(`<div>${escape_html(i.title)} × ${escape_html(i.quantity)}</div>`);
      }
      $$renderer2.push(`<!--]--></td><td class="svelte-1ltwpmi">$${escape_html({ v: o.total }.v.toFixed(2))}</td><td class="svelte-1ltwpmi">`);
      $$renderer2.select(
        {
          value: o.status,
          onchange: (e) => changeStatus(o.id, e.currentTarget.value),
          class: ""
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array_2 = ensure_array_like([o.status, ...transitions[o.status] ?? []]);
          for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
            let s = each_array_2[$$index_1];
            $$renderer3.option({ value: s }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(labels[s] ?? s)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        },
        "svelte-1ltwpmi"
      );
      $$renderer2.push(`</td></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div>`);
  });
}
export {
  _page as default
};
