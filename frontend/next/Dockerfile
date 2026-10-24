# SSR/RSC-фронт (next): build → next start с готовыми node_modules из build-стадии.
# (pnpm-симлинки standalone не выживают при COPY — потому тащим весь воркспейс.)
# Сборка ТОЛЬКО из корня репы: docker build -f frontend/next/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api-client/package.json packages/api-client/
COPY frontend/next/package.json frontend/next/
RUN pnpm install --no-frozen-lockfile --filter @showcase/frontend-next --filter @showcase/api-client
COPY packages/api-client packages/api-client
RUN pnpm --dir packages/api-client build
COPY frontend/next frontend/next
RUN pnpm --dir frontend/next build

FROM node:24-alpine
WORKDIR /repo
RUN corepack enable
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/api-client ./packages/api-client
COPY --from=build /repo/frontend/next ./frontend/next
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm", "--dir", "frontend/next", "exec", "next", "start"]
