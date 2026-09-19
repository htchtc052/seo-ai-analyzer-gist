FROM node:24-slim AS base
WORKDIR /app
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
COPY apps/v5/api apps/v5/api
RUN npm run build -w @seo/v5-api

FROM build AS model
RUN npm run model:fetch -w @seo/v5-api

FROM base
ENV NODE_ENV=production
RUN npm ci --omit=dev --omit=optional -w @seo/v5-api --no-audit --no-fund \
  && rm -rf /root/.npm /root/.cache
COPY --from=build /app/apps/v5/api/dist apps/v5/api/dist
COPY --from=model /app/apps/v5/api/.models apps/v5/api/.models
WORKDIR /app/apps/v5/api
USER node
EXPOSE 3005
CMD ["node", "dist/main.js"]
