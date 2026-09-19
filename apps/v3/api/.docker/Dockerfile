FROM node:24-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
ENV ONNXRUNTIME_NODE_INSTALL=skip
COPY package.json package-lock.json tsconfig.json ./
COPY apps/v1/api/package.json apps/v1/api/
COPY apps/v1/web/package.json apps/v1/web/
COPY apps/v1/examples/package.json apps/v1/examples/
COPY apps/v2/api/package.json apps/v2/api/
COPY apps/v2/web/package.json apps/v2/web/
COPY apps/v3/api/package.json apps/v3/api/
COPY apps/v3/web/package.json apps/v3/web/
COPY apps/v5/api/package.json apps/v5/api/
COPY apps/v5/web/package.json apps/v5/web/

FROM base AS build
RUN npm ci --no-audit --no-fund
COPY apps/v3/api apps/v3/api
RUN npm run build -w @seo/v3-api

FROM base
ENV NODE_ENV=production
COPY apps/v3/api/prisma apps/v3/api/prisma
RUN npm ci --omit=dev --omit=optional -w @seo/v3-api --no-audit --no-fund \
  && npm exec -w @seo/v3-api -- prisma generate \
  && rm -rf /root/.npm /root/.cache
COPY --from=build /app/apps/v3/api/dist apps/v3/api/dist
WORKDIR /app/apps/v3/api
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
