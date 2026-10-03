# Recreio Arcade — G1 + G2

Este repositório reúne as duas partes que o grupo ficou responsável por entregar:

- **`api/`** — a API oficial da Plataforma de Gestão (G1): submissão de jogos por link do GitHub, curadoria, catálogo, placares e rankings. É o código real do G1 (Fastify + TypeScript + Drizzle ORM + PostgreSQL + Zod + Swagger), com 151 testes automatizados.
- **`web/`** — o Portal Web (G2): catálogo, envio de jogo, curadoria, rankings e feedback. Consome só a API acima, não guarda nada por conta própria.

Quem mais consome a API: o **Fliperama (G3)**, que sincroniza o catálogo, baixa os pacotes aprovados e envia os placares. Ver [`docs/INTEGRACAO-G3.md`](docs/INTEGRACAO-G3.md).

## Visão geral

```
            jogo (GitHub + tag)
                    │
                    ▼
   ┌───────────────────────────────┐
   │      api/  (G1 — este repo)    │
   │  Fastify + Drizzle + Postgres  │
   └───────────────┬────────────────┘
                    │ HTTP / JSON
        ┌───────────┴────────────┐
        ▼                        ▼
  web/ (G2 — este repo)     Fliperama (G3)
  Portal: catálogo,         baixa pacotes,
  submissão, curadoria,     envia placares
  rankings
```

## Rodando tudo localmente

Precisa de **Node.js 24** e **Docker** (para o Postgres).

```bash
npm run install:all      # instala api/ e web/
npm run db:up            # sobe o Postgres (docker compose, dentro de api/)
npm run db:migrate       # cria as tabelas
npm run db:seed          # dados de exemplo + tokens de dev (dev-curador / dev-estacao)
npm run dev              # sobe a API (porta 3000) e o Portal (porta 5173) juntos
```

Abra:

- Portal: http://localhost:5173
- API: http://localhost:3000/health
- Swagger (testar a API no navegador): http://localhost:3000/docs

Veja [`docs/DOCKER-E-TESTES.md`](docs/DOCKER-E-TESTES.md) para o passo a passo completo de Docker, Swagger e o que esperar ver em cada teste.

## Testando de verdade

```bash
npm run test:api     # roda os 151 testes automatizados da API (api/test/*.test.ts)
npm run typecheck    # confere se API e Portal compilam sem erro de tipo
```

## Documentação

| Arquivo | Conteúdo |
| --- | --- |
| [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | Como `api/` e `web/` se encaixam, responsabilidades de cada parte |
| [`docs/DOCKER-E-TESTES.md`](docs/DOCKER-E-TESTES.md) | Docker, Swagger, e como testar cada fluxo manualmente |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Publicar a API no Render + Supabase, e o Portal como site estático |
| [`docs/INTEGRACAO-G3.md`](docs/INTEGRACAO-G3.md) | O que o Fliperama (G3) precisa fazer para falar com esta API |
| [`api/docs/`](api/docs) | Documentação de referência da API em si (submissão, curadoria, catálogo, ranking, placares, autenticação) — a fonte da verdade de cada contrato |

## Tokens de desenvolvimento (só localmente, via `npm run db:seed`)

| Tipo | Token | Para quê |
| --- | --- | --- |
| Curador | `dev-curador` | Login na tela de Curadoria do Portal, ou `Authorization: Bearer dev-curador` |
| Estação (fliperama) | `dev-estacao` | `Authorization: Bearer dev-estacao` em `/api/placares` |

Em produção, gere tokens de verdade com `npm run curador:criar -- "Nome"` dentro de `api/` (ver `docs/DOCKER-E-TESTES.md`).
