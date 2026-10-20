// Runtime-адрес API из /config.js (docker-контейнер, ADR-007)
export {};

declare global {
  interface Window {
    API_URL?: string;
  }
}
