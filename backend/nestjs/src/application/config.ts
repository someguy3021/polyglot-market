// Конфиг приложения (application-слой): значение читается из окружения,
// но это конфиг, а не адаптер — клиенты (S3Client) живут в infrastructure.
// URL для клиента может отличаться от эндпоинта загрузки: в k8s-стенде (фича 18)
// pod пишет в http://s3:9000, а браузер читает через проброшенный порт.
const ENDPOINT = process.env.S3_ENDPOINT ?? "http://127.0.0.1:9002";
export const S3_BUCKET = process.env.S3_BUCKET ?? "products";

export const IMAGE_URL_BASE = process.env.S3_URL_BASE ?? `${ENDPOINT}/${S3_BUCKET}`;
