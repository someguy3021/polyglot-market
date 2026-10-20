# SSR-фронт (sveltekit, adapter-node): build → node build.
# Сборка ТОЛЬКО из корня репы: docker build -f frontend/sveltekit/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api-client/package.json packages/api-client/
COPY frontend/sveltekit/package.json frontend/sveltekit/
RUN pnpm install --no-frozen-lockfile --filter @showcase/frontend-sveltekit --filter @showcase/api-client
COPY packages/api-client packages/api-client
RUN pnpm --dir packages/api-client build
COPY frontend/sveltekit frontend/sveltekit
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --dir frontend/sveltekit build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /repo/frontend/sveltekit/build build
COPY --from=build /repo/frontend/sveltekit/node_modules node_modules
COPY --from=build /repo/frontend/sveltekit/package.json ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
