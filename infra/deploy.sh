#!/bin/sh
set -eu
cd "$(dirname "$0")"

v1_repo="$(sed -n 's/^V1_REPO_PATH=//p' .env | head -n 1)"
if [ ! -d "$v1_repo" ]; then
  echo "Нет репозитория первой версии: $v1_repo" >&2
  exit 1
fi

docker compose build v1-api v1-web v2-api v2-web
docker compose up -d --wait redis
docker compose run --rm v1-api npx --no-install prisma migrate deploy
docker compose run --rm v2-api npx --no-install prisma migrate deploy
docker compose up -d
docker compose ps

app_domain="$(sed -n 's/^APP_DOMAIN=//p' .env | head -n 1)"
for path in /v1/api/health /v2/api/health; do
  attempts=0
  until curl --fail --silent --show-error --connect-timeout 5 --max-time 15 "https://${app_domain}${path}"; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 12 ]; then
      echo "Не отвечает: ${path}" >&2
      exit 1
    fi
    sleep 5
  done
  echo " <- ${path}"
done
