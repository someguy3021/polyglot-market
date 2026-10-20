# SSR/RSC-фронт (next): build → .next + next start.
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
WORKDIR /app
COPY --from=build /repo/frontend/next/package.json ./
COPY --from=build /repo/frontend/next/.next .next
COPY --from=build /repo/frontend/next/public public
RUN npm install --omit=dev --no-audit --no-fund
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV PORT=3000
EXPOSE 3000
CMD ["npx", "next", "start"]
