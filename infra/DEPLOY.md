# Деплой

Прод — VPS с Ubuntu, поддомен `seo-analyzer.proclouds.ru`. На нём стоят рядом
несколько версий инструмента, каждая в своей папке:

| Путь  | Что это                | Исходники       |
| ----- | ---------------------- | --------------- |
| `/`   | ссылки и `robots.txt`  | `infra/landing` |
| `/v1` | первая попытка         | `apps/v1`       |
| `/v2` | версия с обходом сайта | `apps/v2`       |

Образы собираются на самом сервере из исходников: реестр и CI для такой задачи
лишние. Весь поддомен закрыт от индексации — `noindex` стоит и мета-тегом, и
заголовком `X-Robots-Tag`.

## Как устроены пути

Один базовый путь задаётся в трёх местах, и все три берут его из одного места:

1. `APP_BASE_PATH` — аргумент сборки web-образа, попадает в `base` у Vite;
2. роутер и клиент API читают его же через `import.meta.env.BASE_URL`;
3. Traefik срезает префикс middleware `stripprefix`, поэтому внутри контейнеров
   пути остаются обычными — nginx и `setGlobalPrefix("api")` не знают про `/v2`.

Чтобы добавить следующую версию, достаточно нового `APP_BASE_PATH` и пары
роутеров с тем же набором меток.

## Postgres на хосте

База вынесена из Docker: версий несколько, база одна на всех, и переживать
пересоздание контейнеров она не должна.

```bash
apt install -y postgresql-17
```

В `/etc/postgresql/17/main/postgresql.conf` разрешить адрес docker-моста —
публичный интерфейс не открываем:

```
listen_addresses = 'localhost,172.17.0.1'
```

В `/etc/postgresql/17/main/pg_hba.conf` пустить контейнеры (у каждой сети
compose свой подсеть внутри этого диапазона):

```
host    all    all    172.16.0.0/12    scram-sha-256
```

Роль и базы — пароль только hex, он идёт внутрь строки подключения:

```bash
sudo -u postgres psql -c "CREATE ROLE seo LOGIN PASSWORD '$(openssl rand -hex 24)'"
sudo -u postgres createdb -O seo seo_v1
sudo -u postgres createdb -O seo seo_v2
systemctl restart postgresql
```

Тот же пароль положить в `POSTGRES_PASSWORD`. Контейнеры ходят на хост по имени
`host.docker.internal` — оно появляется из `extra_hosts: host-gateway`.

## Новый сервер

A-запись поддомена должна указывать на сервер до первого запуска, иначе Let's
Encrypt не выпустит сертификат.

```bash
curl -fsSL https://get.docker.com | sh

git clone https://github.com/htchtc052/seo-ai-analyzer-gist.git /srv/seo-ai-analyzer-gist
cd /srv/seo-ai-analyzer-gist
cp infra/.env.example infra/.env && chmod 600 infra/.env
```

В `infra/.env` задать `POSTGRES_PASSWORD` (тот же, что у роли на хосте),
`REDIS_PASSWORD` через `openssl rand -hex 24` и `LLM_API_KEY` провайдера
embeddings. Затем поднять Postgres по разделу выше и запустить `infra/deploy.sh`.

Сборка каждого web-образа требует около 1 ГБ свободной памяти, а их несколько.
На машине с 2 ГБ RAM держите swap включённым.

## Обновление

```bash
ssh root@seo-analyzer.proclouds.ru 'cd /srv/seo-ai-analyzer-gist && git pull --ff-only && infra/deploy.sh'
```

Новые переменные из `.env.example` на сервер сами не попадают.
`docker compose down -v` удаляет очереди и сертификаты — но не базы: они на
хосте и переживают любой перезапуск контейнеров.

## Модель embeddings

`LLM_EMBEDDING_MODEL` может быть любой моделью провайдера: запрос и фрагменты
уходят простым текстом, без префиксов задач под конкретное семейство моделей.
