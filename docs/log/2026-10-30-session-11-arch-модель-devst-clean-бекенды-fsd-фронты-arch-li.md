# Сессия 11 (2026-10-30): arch-модель devst: Clean бекенды, FSD фронты, arch-linting

> **Суть:** архитектура репы впервые описана arch-моделью devst (фича 16/17, ADR-014): 26 ролей — Clean на обоих бекендах, FSD на всех 7 фронтах; код физически переложен по слоям; `devst arch check` — 0 нарушений, карта отрисована.
> **Коммиты:** a60fdc6 (модель+канон) → 00df933 (nestjs Clean) → 544ad16 (laravel Clean) → f1d948f (фронты FSD) → доки.
> **Файлы:** ~200 (перенос git mv + правки импортов + модель/канон/ADR/лог)

## Что сделано

1. **Диагностика:** `devst arch check` до сессии — «ОШИБКА: модели нет»; `arch detect` — машинный fallback пуст (R19: черновик по папкам). Архитектуры в devst не было ни модельно, ни картой.
2. **Разведка стека:** граф кода (`devst analyze`) даёт 500 рёбер по nestjs, 109 по фронтам, **0 по laravel** (PHP `use`-импорты не маппятся в пути — blast по `app/Models/Product.php` пуст). Вывод: «зубья» линтинга работают на TS/Vue; Laravel-часть модели — декларативная (зафиксировано в ADR-014).
3. **Модель** (`docs/architecture/arch.model.json`, `arch init --preset empty` + ручная сборка, `arch validate` ✓): 26 ролей.
   - Бекенды — Clean: nest/{domain,application,infrastructure,presentation}, laravel/{domain,application,infrastructure,presentation,composition}; рёбра — dependency rule (внутрь, presentation→application+domain+infrastructure).
   - Фронты — FSD: <app>/{app,pages(slices),shared} + nuxt/features; рёбра «строго вниз», default-deny (кросс-приложенческие импорты запрещены автоматически).
   - Наследование пресета (extends) отклонено: один пресет на модель, коллизия имён fsd/clean `entities` (см. ADR-014 «Отвергнуто»).
4. **NestJS → Clean** (git mv + правки импортов): `domain/` (сущности + ContractError, вынесен из contract-exception.filter), `application/` (сервисы, dto-mappers, порт `ImageStorage`, конфиг `IMAGE_URL_BASE`), `infrastructure/` (S3ImageStorage — реализация порта; pino-логгер), `presentation/` (контроллеры, DTO, гарды, фильтр, метрики, health). staff-контроллер (187 строк с репозиториями) → `StaffService` + тонкий контроллер; seller.service теперь с S3 только через порт (`@Inject(IMAGE_STORAGE)`). Шелл (main.ts, app.module.ts, auth.module.ts, spec) не тронут — `dist/main.js` и деплой без изменений.
5. **Laravel → Clean:** 12 моделей → `app/Domain/Models` (`App\Domain\Models`), CartResolver → `app/Application/Services` (`App\Application\Services`); namespace заменены во всех 28 файлах (контроллеры, ресурсы, тесты, config/auth.php).
6. **7 фронтов → FSD:** везде `src/app` (App/main/router), `src/pages`, `src/shared` (api/сторы); спец-решения: react RequireAuth → `shared/ui` (был горизонтальный импорт), nuxt — auto-import перенастроен (`imports.dirs`, `components: features/auth/ui`), sveltekit — `$lib`→`$shared` + alias, next — `src/lib`→`src/shared`, angular — session.service → `src/app/shared`.
7. **arch check поймал первое нарушение в день включения:** quasar RegisterPage → LoginPage (горизонталь pages). Чинено по- FSD: обёртка удалена, `/register` ведёт на LoginPage (как в vue2/react/sveltekit).
8. **Канон и карта:** `devst arch canon` → 02-arch-roles.md; `arch map --json` — 26 узлов с числами файлов, 0 violations (в devst-ui — вкладка Arch, есть PNG-экспорт).

## Прогоны (все зелёные)

- `tsc` сборка NestJS ✓; vitest **7/7**; php artisan boot ✓; phpunit **7/7** (14 assertions).
- Сборки фронтов: quasar ✓, vue2 ✓, react ✓, sveltekit ✓, nuxt ✓, angular ✓; next — `tsc --noEmit` ✓ (полный `next build` на этой машине падает EPERM/symlink в standalone-упаковке — **прехат**, stash-тестом доказано, что падает и код до рефакторинга; docker/CI в Linux не затронуты).
- Conformance: **17/17 против NestJS (:3000) и 17/17 против Laravel (:8010)** — контракт не задет.
- `devst arch check`: **0 нарушений** (непокрытых файлов 400 — скрипты/panel/e2e/инфра, вне ролей намеренно).
- E2E-матрица 2×7: `pnpm e2e:matrix` — см. «Итог».

## Грабли сессии

- **MSYS-манглинг бэкслэшей:** `perl -pi -e 's/App\\Models/…/'` в Git Bash молча не совпадал (аргумент переписывается) — обойти `\x5C` (hex-код `\`) в паттерне; find -print0 | xargs -0 вместо grep-путей с `\`.
- sed-паттерн `from "../pages/` не ловит динамические `import("../pages/…")` — отдельные замены.
- `interface` TS не допускает `!`-ассерты (перенёс PromoCodeInputDto из класса — снял `!`).
- Бекенды для conformance держать в фоне с явным `cd` (php artisan ищет artisan в cwd).

## Что осталось / что всплыло

- PHP-граф без рёбер — Laravel-слои машина не проверяет (ждёт PSR-4-маппинг в devst analyze); проверка руками/ревью.
- Файлы вне ролей (400) — осознанно: v1 покрывает 9 приложений; тесты/скрипты можно внести ролями позже.
- `devst arch detect` — машинный fallback пуст (честно записано в ADR-014 «Последствия»).
- Ночной прогон CI и docker-смоук фронтов подтверждят сборки в Linux (локально проверено сборками).

## Гейт закрытия сессии (фича 04 §7)

- Затронутые задачи: задач по arch-модели в реестре не было; свит через `devst board` в конце сессии.
- Свип: коммиты сессии делают неправдой упоминания `App\Models`/`App\Services` и плоской структуры фронтов в доках — grep по docs/ показал упоминания только в ADR-014 (описание переезда) и логе; фича-доки фронтов структуру `src/` не фиксируют.

## Итог

- Состояние: модель+канон+карта в репе; `devst check` — 0 ошибок; юниты 7/7 × 2, conformance 17/17 × 2, arch check 0 нарушений, **e2e-матрица 2×7 = 14/14 зелёные** (все 7 фронтов на обоих бекендах после перекладки). Архитектура отрисована: `arch map` — 26 ролей, 0 violations.
