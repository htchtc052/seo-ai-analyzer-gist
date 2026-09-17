FROM node:24-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY apps/v1/api/package.json apps/v1/api/
COPY apps/v1/web/package.json apps/v1/web/
COPY apps/v1/examples/package.json apps/v1/examples/
COPY apps/v2/api/package.json apps/v2/api/
COPY apps/v2/web/package.json apps/v2/web/

FROM base AS build
RUN npm ci --no-audit --no-fund
COPY apps/v2/api apps/v2/api
RUN npm run build -w @seo/v2-api

FROM base
ENV NODE_ENV=production
COPY apps/v2/api/prisma apps/v2/api/prisma
RUN npm ci --omit=dev --omit=optional -w @seo/v2-api --no-audit --no-fund \
  && npm exec -w @seo/v2-api -- prisma generate \
  && rm -rf /root/.npm /root/.cache
COPY --from=build /app/apps/v2/api/dist apps/v2/api/dist
WORKDIR /app/apps/v2/api
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
