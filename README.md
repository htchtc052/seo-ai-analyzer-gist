# SEO AI Analyzer GIST

Proof of concept for comparing the semantic coverage of two explicitly selected
domains against one search query.

## Development

Requires Node.js 24 or newer, Docker, and any OpenAI-compatible embeddings
endpoint. Nothing in the code is tied to a particular provider: production runs
against a hosted gateway, while `apps/api/.env.example` points at a local Ollama
because that needs no key.

```bash
npm install
cp apps/api/.env.example apps/api/.env
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate -w @seo-ai-analyzer-gist/api
npm run dev
```

PostgreSQL stores analyses, pages, fragments, embeddings, and scores. Redis is
used only by BullMQ. The local development connection strings are documented in
`apps/api/.env.example`.

`LLM_BASE_URL`, `LLM_API_KEY` and `LLM_EMBEDDING_MODEL` select the embeddings
provider. The query and the fragments are sent as plain text, with no
model-specific task prefixes, so any embedding model works.

Batches from the provider are not trusted: see `EmbeddingsService`, which places
vectors by their index and rejects a batch whose indices repeat or whose entries
share one vector between different inputs.

The web app runs at `http://localhost:5173` and proxies `/api` requests to the NestJS API at `http://localhost:3001`.

## Project structure

```text
apps/api  NestJS API
apps/web  React application
apps/api/prisma  PostgreSQL schema and migrations
docs      Product decisions and references
infra     Production compose file and deploy script
```

Deployment is described in [`infra/DEPLOY.md`](infra/DEPLOY.md).

The previous local implementation at `../react-linkedin` is a development donor only. This repository has no runtime or build dependency on it.
