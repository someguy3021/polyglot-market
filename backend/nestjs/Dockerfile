# NestJS-бекенд (фича 04): build → runtime на node:24-alpine.
# Сборка ТОЛЬКО из корня репы: docker build -f backend/nestjs/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /app
COPY backend/nestjs/package.json ./
RUN npm install --no-audit --no-fund
COPY backend/nestjs .
RUN npx tsc -p tsconfig.build.json

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/nestjs/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/dist dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
