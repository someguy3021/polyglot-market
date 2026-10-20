import { e as ensure_array_like, a as attr, c as escape_html, d as derived } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/api.js";
import { c as cart } from "../../../chunks/session.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let shipping = [];
    let method = "";
    let promoCode = "";
    let placing = false;
    let address = { line1: "", line2: "", city: "", zip: "", country: "US" };
    const shippingPrice = derived(() => shipping.find((m) => m.code === method)?.price ?? 0);
    const total = derived(() => Math.max(0, cart.subtotal - 0) + shippingPrice());
    const canPlace = derived(() => cart.items.length > 0 && method !== "");
    $$renderer2.push(`<div class="wrap svelte-jbcej5"><h1>Оформление заказа</h1> `);
    if (cart.items.length === 0) {
      $$renderer2.push(`<!--[0--><p>Корзина пуста. <a href="/">К каталогу</a></p>`);
    } else {
      $$renderer2.push(`<!--[-1--><h3 class="svelte-jbcej5">1. Доставка</h3> <!--[-->`);
      const each_array = ensure_array_like(shipping);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let m = each_array[$$index];
        $$renderer2.push(`<label class="ship svelte-jbcej5"><input type="radio"${attr("checked", method === m.code, true)}${attr("value", m.code)}/> ${escape_html(m.name)} — $${escape_html(m.price.toFixed(2))} · ${escape_html(m.etaDays)} дн.</label>`);
      }
      $$renderer2.push(`<!--]--> <h3 class="svelte-jbcej5">2. Промокод</h3> <div class="promo svelte-jbcej5"><input placeholder="Промокод (например WELCOME10)"${attr("value", promoCode)} class="svelte-jbcej5"/> <button>Проверить</button> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <h3 class="svelte-jbcej5">3. Адрес</h3> <div class="addr svelte-jbcej5"><input placeholder="Улица, дом"${attr("value", address.line1)} class="svelte-jbcej5"/> <input placeholder="Квартира (опц.)"${attr("value", address.line2)} class="svelte-jbcej5"/> <input placeholder="Город"${attr("value", address.city)} class="svelte-jbcej5"/> <input placeholder="Индекс"${attr("value", address.zip)} class="svelte-jbcej5"/> <input placeholder="US"${attr("value", address.country)}${attr("maxlength", 2)} class="svelte-jbcej5"/></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="total svelte-jbcej5"><span>Товары: $${escape_html(cart.subtotal.toFixed(2))} `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></span> <strong>К оплате: $${escape_html(total().toFixed(2))}</strong> <button${attr("disabled", !canPlace() || placing, true)} class="svelte-jbcej5">${escape_html("Подтвердить заказ")}</button></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
