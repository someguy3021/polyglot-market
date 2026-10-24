// Runtime-адрес API из /config.js (ADR-007): окно читает клиент.
declare global {
  interface Window {
    API_URL?: string;
  }
}

export {};
