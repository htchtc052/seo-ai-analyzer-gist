#!/bin/sh
set -eu
cd "$(dirname "$0")"

missing=""
for name in $(sed -n 's/^\([A-Z_][A-Z0-9_]*\)=.*/\1/p' .env.example); do
  grep -q "^${name}=" .env || missing="${missing} ${name}"
done
if [ -n "$missing" ]; then
  echo ".env is missing variables:${missing}" >&2
  exit 1
fi

docker compose build landing gist v1-api v1-web v2-api v2-web v3-api v3-web
docker compose run --rm v1-api npx --no-install prisma migrate deploy
docker compose run --rm v2-api npx --no-install prisma migrate deploy
docker compose run --rm v3-api npx --no-install prisma migrate deploy
docker compose up -d
docker compose ps

app_domain="$(sed -n 's/^APP_DOMAIN=//p' .env | head -n 1)"
for path in /v1/api/health /v2/api/health /v3/api/health; do
  attempts=0
  until curl --fail --silent --show-error --connect-timeout 5 --max-time 15 "https://${app_domain}${path}"; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 12 ]; then
      echo "No answer from ${path}" >&2
      exit 1
    fi
    sleep 5
  done
  echo " <- ${path}"
done
