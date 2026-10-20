# SPA-фронт (angular): multi-stage build → node-runtime + serve.mjs (ADR-007).
# Сборка ТОЛЬКО из корня репы: docker build -f frontend/angular/Dockerfile .
# API_URL подставляется в runtime через /config.js (окно читает клиент).
FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api-client/package.json packages/api-client/
COPY frontend/angular/package.json frontend/angular/
RUN pnpm install --no-frozen-lockfile
COPY packages/api-client packages/api-client
RUN pnpm --dir packages/api-client build
COPY frontend/angular frontend/angular
RUN pnpm --dir frontend/angular build

FROM node:24-alpine
WORKDIR /srv
COPY --from=build /repo/frontend/angular/dist dist
COPY frontend/angular/serve.mjs serve.mjs
ENV API_URL=http://localhost:8000
ENV SPA_ROOT=dist/angular-frontend/browser
EXPOSE 80
CMD ["node", "serve.mjs"]
