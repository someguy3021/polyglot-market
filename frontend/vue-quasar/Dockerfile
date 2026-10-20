# SPA-фронт (vue-quasar): multi-stage build → node-runtime + serve.mjs (ADR-007).
# Сборка ТОЛЬКО из корня репы: docker build -f frontend/vue-quasar/Dockerfile .
# API_URL подставляется в runtime через /config.js (окно читает клиент).
FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api-client/package.json packages/api-client/
COPY frontend/vue-quasar/package.json frontend/vue-quasar/
RUN pnpm install --no-frozen-lockfile
COPY packages/api-client packages/api-client
RUN pnpm --dir packages/api-client build
COPY frontend/vue-quasar frontend/vue-quasar
RUN pnpm --dir frontend/vue-quasar build

FROM node:24-alpine
WORKDIR /srv
COPY --from=build /repo/frontend/vue-quasar/dist dist
COPY frontend/vue-quasar/serve.mjs serve.mjs
ENV API_URL=http://localhost:8000
EXPOSE 80
CMD ["node", "serve.mjs"]
