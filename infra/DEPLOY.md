# Деплой

Прод — VPS с Ubuntu, домен `seo-analyzer.proclouds.ru`. Образы собираются на
самом сервере из исходников репозитория: реестр и CI для одного сервиса лишние.

## Новый сервер

A-запись домена должна указывать на сервер до первого запуска, иначе Let's
Encrypt не выпустит сертификат.

```bash
curl -fsSL https://get.docker.com | sh

git clone https://github.com/htchtc052/seo-ai-analyzer-gist.git /srv/seo-ai-analyzer-gist
cd /srv/seo-ai-analyzer-gist
cp infra/.env.example infra/.env && chmod 600 infra/.env
```

В `infra/.env` задать `POSTGRES_PASSWORD` и `REDIS_PASSWORD` через
`openssl rand -hex 24` — пароли входят в URL подключения, поэтому только hex — и
`LLM_API_KEY` провайдера embeddings. Затем `infra/deploy.sh`.

Сборка web требует около 1 ГБ свободной памяти. На машине с 2 ГБ RAM держите
swap включённым.

## Обновление

```bash
ssh root@seo-analyzer.proclouds.ru 'cd /srv/seo-ai-analyzer-gist && git pull --ff-only && infra/deploy.sh'
```

Новые переменные из `.env.example` на сервер сами не попадают.
`docker compose down -v` удаляет базу и сертификаты.

## Модель embeddings

`LLM_EMBEDDING_MODEL` может быть любой моделью провайдера: запрос и фрагменты
уходят простым текстом, без префиксов задач под конкретное семейство моделей.
