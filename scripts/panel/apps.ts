// Конфигурация приложений менеджера процессов (фича 06).
// laravel/nestjs — бекенды: инвариант «один активный» (ADR-006).
// Фронты появятся по мере фаз; панель показывает их как «нет в репе».
export interface AppSpec {
  key: string;
  title: string;
  kind: "backend" | "frontend" | "infra";
  cwd: string;
  command: string; // shell-строка; {port} подставляется фактическим портом
  defaultPort: number;
  healthPath?: string;
  present: boolean; // код существует в репе
}

export const APPS: AppSpec[] = [
  {
    key: "laravel",
    title: "Laravel API",
    kind: "backend",
    cwd: "backend/laravel",
    command: "php artisan serve --host=127.0.0.1 --port={port}",
    defaultPort: 8000,
    healthPath: "/health",
    present: true,
  },
  {
    key: "nestjs",
    title: "NestJS API",
    kind: "backend",
    cwd: "backend/nestjs",
    command: "node dist/main.js",
    defaultPort: 3000,
    healthPath: "/health",
    present: true,
  },
  {
    key: "quasar",
    title: "Vue 3 + Quasar",
    kind: "frontend",
    cwd: "frontend/vue-quasar",
    command: "npx quasar dev --port {port}",
    defaultPort: 9000,
    healthPath: "/",
    present: true,
  },
  {
    key: "vue2",
    title: "Vue 2 + Vite",
    kind: "frontend",
    cwd: "frontend/vue2",
    command: "npx vite --port {port}",
    defaultPort: 9001,
    healthPath: "/",
    present: true,
  },
  {
    key: "angular",
    title: "Angular",
    kind: "frontend",
    cwd: "frontend/angular",
    command: "npx ng serve --host 127.0.0.1 --port {port}",
    defaultPort: 4200,
    healthPath: "/",
    present: true,
  },
  {
    key: "react",
    title: "React + Vite",
    kind: "frontend",
    cwd: "frontend/react",
    command: "npx vite --port {port}",
    defaultPort: 3001,
    healthPath: "/",
    present: true,
  },
  {
    key: "nuxt",
    title: "Nuxt",
    kind: "frontend",
    cwd: "frontend/nuxt",
    command: "npx nuxt dev --port {port}",
    defaultPort: 3002,
    healthPath: "/",
    present: true,
  },
  {
    key: "next",
    title: "Next.js",
    kind: "frontend",
    cwd: "frontend/next",
    command: "npx next dev -H 127.0.0.1 -p {port}",
    defaultPort: 3003,
    healthPath: "/",
    present: true,
  },
  {
    key: "sveltekit",
    title: "SvelteKit",
    kind: "frontend",
    cwd: "frontend/sveltekit",
    command: "npx vite dev --port {port}",
    defaultPort: 3004,
    healthPath: "/",
    present: true,
  },
];

export const MANAGER_PORT = Number(process.env.PANEL_PORT ?? 5555);
export const TAIL_LINES = 200;
