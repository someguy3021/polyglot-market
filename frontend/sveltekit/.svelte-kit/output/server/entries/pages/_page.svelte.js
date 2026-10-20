import { a as attr, e as ensure_array_like, c as escape_html, b as attr_class } from "../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
import "../../chunks/session.svelte.js";
function goto(url, opts = {}) {
  {
    throw new Error("Cannot call goto(...) on the server");
  }
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let q = "";
    let category = "";
    let sort = "newest";
    const sortOptions = [
      { value: "newest", label: "Сначала новые" },
      { value: "oldest", label: "Сначала старые" },
      { value: "price_asc", label: "Дешевле" },
      { value: "price_desc", label: "Дороже" }
    ];
    const image = (p) => {
      const primary = (p.images || []).find((i) => i.isPrimary) || (p.images || [])[0];
      return primary ? primary.url : "";
    };
    function applyFilters() {
      const params = new URLSearchParams();
      goto(`/?${params.toString()}`);
    }
    $$renderer2.push(`<div class="filters svelte-1uha8ag"><input placeholder="Поиск по названию"${attr("value", q)} class="svelte-1uha8ag"/> `);
    $$renderer2.select(
      { value: category, onchange: applyFilters, class: "" },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`Все категории`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(data.categories);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let c = each_array[$$index];
          $$renderer3.option({ value: c.slug }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(c.name)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-1uha8ag"
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      { value: sort, onchange: applyFilters, class: "" },
      ($$renderer3) => {
        $$renderer3.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(sortOptions);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let o = each_array_1[$$index_1];
          $$renderer3.option({ value: o.value }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(o.label)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-1uha8ag"
    );
    $$renderer2.push(`</div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid svelte-1uha8ag"><!--[-->`);
    const each_array_2 = ensure_array_like(data.products);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let p = each_array_2[$$index_2];
      $$renderer2.push(`<div class="card svelte-1uha8ag" role="button"${attr("tabindex", 0)}><img${attr("src", image(p))}${attr("alt", p.title)} class="svelte-1uha8ag"/> <div class="body svelte-1uha8ag"><div class="title svelte-1uha8ag">${escape_html(p.title)}</div> <div class="meta svelte-1uha8ag">${escape_html(p.category.name)} · ${escape_html(p.seller.shopName)}</div> <div class="price svelte-1uha8ag">$${escape_html(Number(p.price).toFixed(2))}</div></div> <div class="actions svelte-1uha8ag"><span${attr_class("stock svelte-1uha8ag", void 0, { "out": p.stock <= 0 })}>${escape_html(p.stock > 0 ? `в наличии: ${p.stock}` : "нет")}</span> <button${attr("disabled", p.stock <= 0, true)} class="svelte-1uha8ag">В корзину</button></div></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.meta.lastPage > 1) {
      $$renderer2.push(`<!--[0--><div class="pager svelte-1uha8ag"><!--[-->`);
      const each_array_3 = ensure_array_like(Array(data.meta.lastPage));
      for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
        each_array_3[i];
        $$renderer2.push(`<button${attr_class("svelte-1uha8ag", void 0, { "current": i + 1 === data.meta.currentPage })}>${escape_html(i + 1)}</button>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
