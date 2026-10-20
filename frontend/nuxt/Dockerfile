# SSR-фронт (nuxt): build → .output/server/index.mjs (нитро слушает PORT).
# Сборка ТОЛЬКО из корня репы: docker build -f frontend/nuxt/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api-client/package.json packages/api-client/
COPY frontend/nuxt/package.json frontend/nuxt/
RUN pnpm install --no-frozen-lockfile --filter @showcase/frontend-nuxt --filter @showcase/api-client
COPY packages/api-client packages/api-client
RUN pnpm --dir packages/api-client build
COPY frontend/nuxt frontend/nuxt
RUN pnpm --dir frontend/nuxt build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /repo/frontend/nuxt/.output .output
ENV NUXT_PUBLIC_API_URL=http://localhost:8000
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
