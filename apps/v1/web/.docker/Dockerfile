FROM node:24-alpine AS build
ARG APP_BASE_PATH=/
ENV APP_BASE_PATH=$APP_BASE_PATH
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY apps/v1/api/package.json apps/v1/api/
COPY apps/v1/web/package.json apps/v1/web/
COPY apps/v1/examples/package.json apps/v1/examples/
COPY apps/v2/api/package.json apps/v2/api/
COPY apps/v2/web/package.json apps/v2/web/
RUN npm ci --no-audit --no-fund
COPY apps/v1/examples apps/v1/examples
COPY apps/v1/web apps/v1/web
RUN npm run build -w @seo/v1-web

FROM nginx:1.29-alpine
COPY apps/v1/web/.docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/v1/web/dist /usr/share/nginx/html
