#!/bin/sh
set -eu
cd "$(dirname "$0")"

grep -q "^APP_DOMAIN=" .env || {
  echo ".env is missing APP_DOMAIN" >&2
  exit 1
}

docker compose build landing v4 v5-api v5-web
docker compose up -d landing v4 v5-api v5-web traefik
docker compose ps

app_domain="$(sed -n 's/^APP_DOMAIN=//p' .env | head -n 1)"
for path in /v4 /v5/api/health; do
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
