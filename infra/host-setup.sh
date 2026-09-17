#!/bin/sh
set -eu

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${REDIS_PASSWORD:?REDIS_PASSWORD is required}"
POSTGRES_USER="${POSTGRES_USER:-seo}"
DATABASES="${DATABASES:-seo_v1 seo_v2 seo_v3}"

if ! command -v docker >/dev/null; then
  echo "Docker must be installed first: its bridge is how containers reach the host" >&2
  exit 1
fi

bridge="$(ip -4 addr show docker0 | awk '/inet /{print $2}' | cut -d/ -f1)"
[ -n "$bridge" ] || { echo "Could not find the docker0 address" >&2; exit 1; }
echo "Docker bridge: $bridge"

if ! command -v psql >/dev/null; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql
fi

conf="$(ls -d /etc/postgresql/*/main | tail -n 1)"

if ! grep -q "^listen_addresses = 'localhost,$bridge'" "$conf/postgresql.conf"; then
  sed -i "/^#\?listen_addresses/d" "$conf/postgresql.conf"
  echo "listen_addresses = 'localhost,$bridge'" >> "$conf/postgresql.conf"
  echo "postgresql.conf: listening on localhost and the bridge"
fi

if ! grep -q "^host    all    all    172.16.0.0/12" "$conf/pg_hba.conf"; then
  echo "host    all    all    172.16.0.0/12    scram-sha-256" >> "$conf/pg_hba.conf"
  echo "pg_hba.conf: docker networks allowed"
fi

systemctl enable --quiet postgresql
systemctl restart postgresql

role_exists="$(su postgres -c "psql -tAc \"select 1 from pg_roles where rolname='$POSTGRES_USER'\"")"
if [ "$role_exists" = "1" ]; then
  su postgres -c "psql -qc \"alter role $POSTGRES_USER login password '$POSTGRES_PASSWORD'\""
else
  su postgres -c "psql -qc \"create role $POSTGRES_USER login password '$POSTGRES_PASSWORD'\""
fi
echo "role $POSTGRES_USER ready"

for db in $DATABASES; do
  exists="$(su postgres -c "psql -tAc \"select 1 from pg_database where datname='$db'\"")"
  [ "$exists" = "1" ] || su postgres -c "createdb -O $POSTGRES_USER $db"
  echo "database $db ready"
done

if ! command -v redis-server >/dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq redis-server
fi

redis_conf=/etc/redis/redis.conf
if ! grep -q "^bind 127.0.0.1 $bridge$" "$redis_conf"; then
  sed -i "/^bind /d" "$redis_conf"
  echo "bind 127.0.0.1 $bridge" >> "$redis_conf"
  echo "redis: listening on localhost and the bridge"
fi
if ! grep -q "^requirepass $REDIS_PASSWORD$" "$redis_conf"; then
  sed -i "/^requirepass /d" "$redis_conf"
  echo "requirepass $REDIS_PASSWORD" >> "$redis_conf"
  echo "redis: password set"
fi
if ! grep -q "^protected-mode no$" "$redis_conf"; then
  sed -i "/^protected-mode /d" "$redis_conf"
  echo "protected-mode no" >> "$redis_conf"
fi

systemctl enable --quiet redis-server
systemctl restart redis-server

pg_isready -h "$bridge" -q && echo "postgres answers on $bridge"
redis-cli -h "$bridge" -a "$REDIS_PASSWORD" --no-auth-warning ping >/dev/null && echo "redis answers on $bridge"
echo "Host ready."
