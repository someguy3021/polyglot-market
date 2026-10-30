# ADR-014: arch-модель devst: Clean на бекендах, FSD на фронтах, arch-linting с зубами

> **Статус:** Принято · **Дата:** 2026-10-30

**Суть:** вся архитектура репы описана как `docs/architecture/arch.model.json` (фича 16, ADR-030): 26 ролей — Clean-слои на обоих бекендах, FSD-слои на всех 7 фронтах; матрица рёбер default-deny; `devst arch check` ловит нарушения на живом графе кода, `arch map` рисует карту. Код физически переложен по слоям в тот же день.

**Отвергнуто:** наследование фабричного пресета (`arch init --preset fsd --extends`) — пресет описывает один `src/**`, а у нас монорепа с 9 приложениями и пересекающимися именами слоёв (fsd `entities` ≠ clean `entities`); модель самостоятельная, правила FSD/Clean переписаны 1-в-1 с rulebook'ов в роли и матрицу.

**Связанное:** features/16 · features/17 · [ADR-030 (в devst)](сосед://docs/decisions) · [02-arch-roles.md](../architecture/02-arch-roles.md)

## Контекст

- Вопрос автора (2026-10-30): «вся архитектура в devst отрисована? если нет — настроить линтинг, на бекендах Clean, на фронтах FSD или Clean».
- До этого дня `arch.model.json` не существовало: `devst arch check` отвечал «модели нет», карта (фича 17) строить не из чего.
- Бекенды были плоскими: NestJS — feature-папки (auth/, cart/, …) с контроллерами, содержащими бизнес-логику (staff-контроллер ходил в репозитории напрямую); Laravel — стандартный MVC (Models/, Services/, Http/). Фронты — плоские `src/{api,stores,pages,router}` без слоёв.
- Граф кода (devst analyze) строит рёбра для TS/Vue (500 рёбер nestjs, 109 фронтов), но **не для PHP** (`use App\Models\X` не маппится в пути) — Laravel-часть модели декларативна, «зубья» у TS/Vue.

## Опции

### A. Наследовать фабричный пресет (extends)

- Плюсы: правила живут в базе devst, обновляются с ним.
- Минусы: один пресет на модель; глоб-пути пресета (`src/app/**`) не совпадают с монорепой; коллизия имён ролей fsd/clean (`entities`); переопределял бы всё равно всё.

### B. Самостоятельная модель: 26 ролей, правила из rulebook'ов руками (выбрано)

- Плюсы: точное соответствие монорепе; роли именованы `<app>/<слой>` — карта читается сразу; правило зависимостей FSD (строго вниз) и Clean (зависимости внутрь) записаны явно и видны в каноне.
- Минусы: обновления rulebook'ов в devst не подтекут автоматически — перезаписывать вручную.

## Решение

**Вариант B.** Модель в `docs/architecture/arch.model.json`:

- **Бекенды — Clean (Uncle Bob, dependency rule):** `domain` (пусто внутрь) ← `application` (use-cases, порты) ← `infrastructure` (адаптеры) ← `presentation` (HTTP). У Laravel `Providers/` — отдельная роль `composition` (может во всё внутреннее).
- **Фронты — FSD (feature-sliced.design):** `app` → `pages` (slices, горизонталь запрещена) → `shared`; где есть — `features` → `shared`. Для Next роль `next/pages` покрывает `src/app/**` (App Router = конвенция Next, slices выключены: файлы маршрута — не слайсы).
- **default-deny:** не разрешено явно = запрещено; кросс-приложенческие импорты (quasar → vue2 и т.п.) запрещены автоматически.

Физическая перекладка (коммиты a60fdc6…f1d948f, 2026-10-30):

- NestJS: `src/domain` (сущности + ContractError, вынесен из exception-filter), `src/application` (сервисы фич, DTO-мапперы, порт `ImageStorage`, конфиг `IMAGE_URL_BASE`), `src/infrastructure` (S3ImageStorage — реализация порта, pino-логгер), `src/presentation` (контроллеры, DTO, гарды, фильтр, метрики, health). Логика staff-контроллера вынесена в `StaffService`. seller.service работает с S3 только через порт. Шелл (`main.ts`, `app.module.ts`, `auth.module.ts`, spec) остался в корне `src` — вне ролей (dist/main.js и деплой не тронуты).
- Laravel: `app/Domain/Models` (12 моделей, `App\Domain\Models`), `app/Application/Services` (CartResolver, `App\Application\Services`); `Http` = presentation, `Providers` = composition. Контроллеры ходят в Eloquent-модели напрямую — это разрешено Clean (frameworks→entities); прагматизм осознанный.
- Фронты: `src/app` (корень: App/main/router), `src/pages` (экраны), `src/shared` (api/сторы); nuxt — `shared/{api,session}` + `features/auth` (auto-import перенастроен в nuxt.config), sveltekit — `$lib` → `$shared` (alias в svelte.config), react — RequireAuth в `shared/ui`, angular — `session.service` в `src/app/shared`. В quasar удалена обёртка RegisterPage (горизонтальный импорт pages→pages), `/register` ведёт на LoginPage — как в остальных фронтах.

## Обоснование

- Контракт слоёв должен проверяться машиной, а не ревью глазами: `arch check` на графе кода ловит новые нарушения сразу (поймал горизонтальный импорт RegisterPage→LoginPage в день включения).
- Имена ролей = имена слоёв rulebook'ов: канон (02-arch-roles.md) читается как учебник по проекту.
- Прагматичные решения зафиксированы в why-полях модели: `Repository<T>` TypeORM считается портом; env-конфиг живёт в application; Eloquent-модели = доменные сущности.

## Последствия

**Позитивные:**
- `devst arch check` — 0 нарушений на 26 ролях; канон и карта (`arch map`, вкладка Arch в devst-ui, PNG-экспорт) отрисованы.
- Направление зависимостей enforcement'ится на каждый коммит (arch check в ритуале сессии; можно добавить в CI).
- Регресс-защита сработала по полной: юниты 7/7 оба бекенда, conformance 17/17 × 2, e2e-матрица 2×7.

**Негативные / риски:**
- PHP-граф без рёбер: Laravel-слои декларативны, машина их не проверяет (пока devst не научится маппить PSR-4) — проверка ревью/ручная.
- 400 файлов репы вне ролей (скрипты, panel, e2e, инфра, шелл-файлы) — намеренно: v1 покрывает код 9 приложений.
- Локальный `next build` на этой машине падает с EPERM на symlink в standalone-упаковке — прехат (воспроизводится на коде до рефакторинга, stash-тест); проверка next — `tsc --noEmit` + docker/CI-сборка в Linux.
- `devst arch detect` — машинный fallback пуст: модель собрана вручную по фактическому коду.
