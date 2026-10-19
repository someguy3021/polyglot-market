# Polyglot Market

**One API contract — 2 backends — 7 frontends.** A marketplace built as the ultimate fullstack showcase: the same store, the same database, the same features — implemented twice on the backend (Laravel & NestJS) and seven times on the frontend (Vue 3 + Quasar, Vue 2, Angular, React, Nuxt, Next.js, SvelteKit) — proving with executable tests that frameworks are interchangeable details.

> 🚧 **Status: blueprint.** The architecture, contract design and roadmap are complete (see [`docs/`](docs/README.md)); implementation starts with Phase 1. This README will grow into the recruiter quick-start as code lands.

## The idea

- **Contract-first.** `shared/api-spec/openapi.yaml` is the single source of truth. All 9 applications talk through it; a conformance suite proves both backends answer byte-compatible.
- **One active backend.** Laravel or NestJS — never both. Stop one, start the other: the same frontend, the same data, zero code changes.
- **A real domain.** Not a todo-list: a marketplace with four roles — buyer, seller, moderator, admin — guest carts with merge-on-login, promo codes, shipping methods, order lifecycle, idempotent checkout, image uploads to S3-compatible storage.
- **One command away.** `pnpm doctor && pnpm setup && pnpm start` — a web control panel boots any combination of backends and frontends with live logs.
- **Docker where it belongs.** PostgreSQL + MinIO always run in containers; application processes run natively (WSL2 / Linux / macOS). Containerized "1 frontend + 1 backend" combos too — never "everything at once".
- **The factory.** `pnpm extract --front=react --back=nestjs` turns this monorepo into a standalone repository for a single stack — the megarepo is the machine, extracts are the products.

## Documentation

| Doc | What's inside |
|---|---|
| [docs/README.md](docs/README.md) | Docs map & current state |
| [Architecture overview](docs/architecture/01-overview.md) | Layers, ports, launch flow |
| [ADR index](docs/open-questions.md) | Decisions & open questions |
| Features 01–17 | Contract, backends, 7 frontends, infra, panel, E2E, CI, factory, video |

## Requirements (planned)

Linux, macOS, or Windows via **WSL2** · Node.js (LTS, pinned via `.nvmrc`) · pnpm · Docker · PHP 8.4+ & Composer (only for the Laravel backend) · Java is *not* required (generated clients are committed).

## License

[MIT](LICENSE)
