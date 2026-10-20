// Мини-статик-сервер SPA в контейнере: раздаёт dist + /config.js из env API_URL.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// dist-поддиректория настраивается под сборку конкретного фронта (angular: dist/<app>/browser)
const ROOT = process.env.SPA_ROOT
  ? join("/srv", process.env.SPA_ROOT)
  : "/srv/dist";
const PORT = Number(process.env.PORT ?? 80);
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2",
};

createServer(async (req, res) => {
  if (req.url === "/config.js") {
    res.writeHead(200, { "Content-Type": "text/javascript" });
    return res.end(`window.API_URL = "${process.env.API_URL ?? "http://localhost:8000"}";`);
  }
  try {
    const url = (req.url ?? "/").split("?")[0];
    const file = normalize(join(ROOT, url === "/" ? "index.html" : url));
    if (!file.startsWith(ROOT)) throw 0;
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    try {
      const body = await readFile(join(ROOT, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  }
}).listen(PORT, "0.0.0.0", () => console.log(`spa: :${PORT} root=${ROOT}`));
