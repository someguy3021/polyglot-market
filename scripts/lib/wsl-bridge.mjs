// TCP-мост Windows → WSL: когда собственный localhost-forwarding WSL2 отваливается
// (Win10, релеи не перерегистрируются после перезапуска VM), слушаем на Windows-порте
// и проксируем в WSL IP. Запускается infra.mjs как detached-процесс с pid-файлом.
import net from "node:net";
import { writeFileSync } from "node:fs";

// reduce без дженерика: файл .mjs — TS-синтаксис здесь валиден только для eslint, не для node
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] ?? ""]);
  return acc;
}, []));

const listenPort = Number(args.port);
const [toHost, toPortStr] = (args.to ?? "").split(":");
const toPort = Number(toPortStr);

net.createServer((client) => {
  const upstream = net.connect(toPort, toHost);
  client.pipe(upstream).pipe(client);
  upstream.on("error", () => client.destroy());
  client.on("error", () => upstream.destroy());
}).listen(listenPort, "127.0.0.1", () => {
  console.log(`bridge: 127.0.0.1:${listenPort} → ${toHost}:${toPort}`);
  if (args["pid-file"]) writeFileSync(args["pid-file"], String(process.pid));
});
