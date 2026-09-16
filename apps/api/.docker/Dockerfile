FROM node:24-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

FROM base AS build
RUN npm ci --no-audit --no-fund
COPY apps/api apps/api
RUN npm run build -w @seo-ai-analyzer-gist/api

FROM base
ENV NODE_ENV=production
COPY apps/api/prisma apps/api/prisma
RUN npm ci --omit=dev --omit=optional -w @seo-ai-analyzer-gist/api --no-audit --no-fund \
  && npm exec -w @seo-ai-analyzer-gist/api -- prisma generate \
  && rm -rf /root/.npm /root/.cache
COPY --from=build /app/apps/api/dist apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
