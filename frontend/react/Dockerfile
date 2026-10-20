# SPA-шаблон (react): multi-stage build → runtime на node:24-alpine.
# Сборка ТОЛЬКО из корня репы: docker build -f frontend/react/Dockerfile . (ADR-007)
# Runtime без nginx: registry отдаёт не все образы, node:24-alpine надёжнее.
# API_URL подставляется в runtime: CMD пишет dist/config.js, index.html грузит его до бандла.
FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api-client/package.json packages/api-client/
COPY frontend/react/package.json frontend/react/
RUN pnpm install --no-frozen-lockfile
COPY packages/api-client packages/api-client
RUN pnpm --dir packages/api-client build
COPY frontend/react frontend/react
RUN pnpm --dir frontend/react build

FROM node:24-alpine
WORKDIR /srv
COPY --from=build /repo/frontend/react/dist dist
COPY frontend/react/serve.mjs serve.mjs
ENV API_URL=http://localhost:8000
EXPOSE 80
CMD ["sh", "-c", "printf 'window.API_URL = \"%s\";\n' \"$API_URL\" > dist/config.js && node serve.mjs"]
