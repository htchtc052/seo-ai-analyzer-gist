#!/bin/sh
set -eu
cd "$(dirname "$0")"

docker compose build api web
docker compose up -d --wait postgres redis
docker compose run --rm api npx --no-install prisma migrate deploy
docker compose up -d
docker compose ps

app_domain="$(sed -n 's/^APP_DOMAIN=//p' .env | head -n 1)"
attempts=0
until curl --fail --silent --show-error --connect-timeout 5 --max-time 15 "https://${app_domain}/api/health"; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 12 ]; then
    exit 1
  fi
  sleep 5
done
echo
