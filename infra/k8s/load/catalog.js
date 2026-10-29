// k6-сценарий 6.2: нагрузка на каталог через ingress — раскачка HPA.
// Основной груз — nestjs (цель автоскейлинга); laravel получает лёгкий зонд:
// artisan serve — однопоточный dev-сервер, 40 VUs он не держит (перепробовано
// в session 10: очередь 16с и 38% отказов). Это честная рамка демо, не SLA.
import http from "k6/http";
import { sleep } from "k6";

const BASE = __ENV.LOAD_BASE_URL ?? "http://127.0.0.1:8080";

export const options = {
  scenarios: {
    // главный поток: раскачка CPU одной реплы nestjs выше таргета HPA (60%),
    // удержание (HPA добавляет реплики, трафик делится), спуск
    catalog: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 40 },
        { duration: "60s", target: 40 },
        { duration: "30s", target: 1 },
      ],
      exec: "nestLoad",
    },
    // зонд второго бекенда: оба маршрута живут под нагрузкой одновременно
    laravelProbe: {
      executor: "constant-vus",
      vus: 2,
      duration: "2m",
      exec: "laravelLoad",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"], // демо-прогон: падения почти не ждем
  },
};

export function nestLoad() {
  const page = 1 + Math.floor(Math.random() * 4) * 10; // 1..31
  http.get(`${BASE}/api/products?page=${page}`);
  sleep(0.05 + Math.random() * 0.1); // лёгкое «раздумье пользователя»: 50–150 мс
}

export function laravelLoad() {
  const page = 1 + Math.floor(Math.random() * 4) * 10;
  http.get(`${BASE}/api/laravel/products?page=${page}`);
  sleep(0.8 + Math.random() * 0.4); // ~1 rps на VU — по силам dev-серверу
}
