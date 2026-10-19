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
    command: "pnpm run dev -- --port {port}",
    defaultPort: 9000,
    present: false,
  },
  {
    key: "vue2",
    title: "Vue 2 + Vite",
    kind: "frontend",
    cwd: "frontend/vue2",
    command: "pnpm run dev -- --port {port}",
    defaultPort: 9001,
    present: false,
  },
  {
    key: "angular",
    title: "Angular",
    kind: "frontend",
    cwd: "frontend/angular",
    command: "pnpm start -- --port {port}",
    defaultPort: 4200,
    present: false,
  },
  {
    key: "react",
    title: "React + Vite",
    kind: "frontend",
    cwd: "frontend/react",
    command: "pnpm run dev -- --port {port}",
    defaultPort: 3001,
    present: false,
  },
  {
    key: "nuxt",
    title: "Nuxt",
    kind: "frontend",
    cwd: "frontend/nuxt",
    command: "pnpm run dev -- --port {port}",
    defaultPort: 3002,
    present: false,
  },
  {
    key: "next",
    title: "Next.js",
    kind: "frontend",
    cwd: "frontend/next",
    command: "pnpm run dev -- --port {port}",
    defaultPort: 3003,
    present: false,
  },
  {
    key: "sveltekit",
    title: "SvelteKit",
    kind: "frontend",
    cwd: "frontend/sveltekit",
    command: "pnpm run dev -- --port {port}",
    defaultPort: 3004,
    present: false,
  },
];

export const MANAGER_PORT = Number(process.env.PANEL_PORT ?? 5555);
export const TAIL_LINES = 200;
