import { i as head, c as escape_html } from "../../../../chunks/index.js";
import "../../../../chunks/api.js";
import "../../../../chunks/session.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    head("uk8mco", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html("Товар")} — Polyglot Market</title>`);
      });
    });
    {
      $$renderer2.push(`<!--[0--><p>Загрузка…</p>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
