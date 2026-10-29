# dev-S3 (s3rver) для k8s-стенда: образ minio/minio на этой машине не пуллится
# (ADR-008), s3rver — уже принятый dev-fallback (scripts/lib/s3-dev.mjs).
# Сборка ТОЛЬКО из корня репы (ADR-007):
#   docker build -f infra/k8s/s3-dev.Dockerfile -t pm-s3rver:local .
FROM node:24-alpine
WORKDIR /srv
RUN npm install --no-audit --no-fund s3rver@3.7.1
COPY infra/k8s/s3-dev-server.mjs server.mjs
ENV PORT=9000
VOLUME /data
EXPOSE 9000
CMD ["node", "server.mjs"]
