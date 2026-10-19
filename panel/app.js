// Панель управления: карточки приложений, таблица портов, логи с уровнями (фича 06).
// Чистый DOM + polling /api/status раз в 2 секунды.

const state = { selected: null };

async function api(path, options) {
  const res = await fetch(path, options);
  const body = await res.json();
  if (!res.ok && !body.status) throw new Error(body.message ?? res.statusText);
  return body;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function render(apps) {
  const backends = document.getElementById("backend-cards");
  const frontends = document.getElementById("frontend-cards");
  backends.replaceChildren(...apps.filter((a) => a.kind === "backend").map(card));
  frontends.replaceChildren(...apps.filter((a) => a.kind === "frontend").map(card));
  renderPortTable(apps);
  renderLogs(apps);
}

function card(app) {
  const statusText = !app.present
    ? "нет в репе (roadmap)"
    : app.running
      ? `работает · :${app.port} · ${app.health === "up" ? "healthy" : "поднимается…"}`
      : "остановлено";

  return el("div", { class: "card" },
    el("div", { class: "row" },
      el("span", { class: "title" },
        el("span", { class: `dot ${!app.present ? "missing" : app.running && app.health === "up" ? "up" : "down"}` }),
        app.title,
      ),
      el("span", { class: "meta", text: statusText }),
    ),
    el("div", { class: "actions" },
      el("button", {
        text: "Запустить",
        disabled: app.running || !app.present,
        onclick: () => act(`/api/start`, app.key),
      }),
      el("button", {
        class: "stop",
        text: "Остановить",
        disabled: !app.running,
        onclick: () => act(`/api/stop`, app.key),
      }),
      app.running ? el("button", { class: "open", text: "Открыть ↗", onclick: () => window.open(app.url, "_blank") }) : null,
      el("button", {
        class: "ghost small",
        text: "Логи",
        disabled: !app.running,
        onclick: () => { state.selected = app.key; refresh(); },
      }),
    ),
  );
}

function renderPortTable(apps) {
  const tbody = document.querySelector("#port-table tbody");
  tbody.replaceChildren(...apps.map((app) =>
    el("tr", {},
      el("td", { text: app.title }),
      el("td", { text: `:${app.port}` }),
      el("td", { text: !app.present ? "—" : app.running ? (app.health === "up" ? "работает" : "поднимается…") : "остановлено" }),
      el("td", {}, app.running
        ? el("a", { href: app.url, target: "_blank", text: "открыть" })
        : el("span", { text: "" })),
    ),
  ));
}

function renderLogs(apps) {
  const group = document.getElementById("logs-group");
  const current = apps.find((a) => a.key === state.selected);
  if (!current || !current.running) {
    group.hidden = true;
    if (!current) return;
    state.selected = null;
    return;
  }
  group.hidden = false;
  document.getElementById("log-app").textContent = current.title;
  const view = document.getElementById("log-view");
  const nearBottom = view.scrollHeight - view.scrollTop - view.clientHeight < 60;
  view.replaceChildren(...current.logs.map((line) => {
    const level = /\b(error|fatal|exception|failed)\b/i.test(line) ? "error" : /\b(warn|warning|deprecated)\b/i.test(line) ? "warn" : "";
    return el("span", { class: level, text: line + "\n" });
  }));
  if (nearBottom) view.scrollTop = view.scrollHeight;
  const download = document.getElementById("download-log");
  download.onclick = () => window.open(`/api/status`, "_blank");
}

async function act(path, key) {
  try {
    await api(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  } catch (err) {
    alert(err.message);
  }
  await refresh();
}

async function refresh() {
  try {
    const payload = await api("/api/status");
    document.getElementById("setup-note").textContent = payload.setupDone
      ? "среда настроена"
      : "среда не настроена — запустите `pnpm setup`";
    render(payload.apps);
  } catch {
    /* менеджер перезапускается — попробуем в следующий тик */
  }
}

document.getElementById("stop-all").addEventListener("click", () => act("/api/stop-all", ""));
await refresh();
setInterval(refresh, 2000);
