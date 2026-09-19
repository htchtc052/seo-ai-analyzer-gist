FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS model
WORKDIR /app
COPY scripts/fetch-model.mjs scripts/fetch-model.mjs
RUN node scripts/fetch-model.mjs

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=model /app/.models ./.models
USER node
EXPOSE 3000
CMD ["node", "server.js"]
