FROM node:24-alpine AS build
ARG APP_BASE_PATH=/
ENV APP_BASE_PATH=$APP_BASE_PATH
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --no-audit --no-fund
COPY apps/web apps/web
RUN npm run build -w @seo-ai-analyzer-gist/web

FROM nginx:1.29-alpine
COPY apps/web/.docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
