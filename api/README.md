# Plataforma de Gestão — API (G1)

API oficial do Recreio Arcade. Recebe submissões de jogos por link do GitHub, conduz a curadoria, entrega os pacotes aprovados ao fliperama, recebe placares e votos e calcula os rankings.

Quem consome:

- **Portal Web (G2)** — catálogo, submissão, curadoria e rankings.
- **Fliperama (G3)** — sincroniza o catálogo, baixa pacotes e envia placares.

## Stack

- Node.js 24 + TypeScript
- Fastify 5
- PostgreSQL (Supabase em produção) com Drizzle ORM
- Vitest

## Documentação da API

- **Produção:** https://plataforma-gestao-api.onrender.com
- **Swagger (todas as rotas, com exemplos e "Try it out"):** https://plataforma-gestao-api.onrender.com/docs
- Guias por tema em [docs/](docs/), listados abaixo.

## Rodando localmente

Precisa de Node.js 24 e Docker.

```bash
npm ci
cp .env.example .env   # já aponta para o Postgres do docker compose
npm run db:up          # sobe o Postgres local (bancos gestao e gestao_test)
npm run db:migrate     # cria as tabelas
npm run db:seed        # dados de exemplo; tokens dev-curador e dev-estacao
npm run dev            # http://localhost:3000/health
```

`npm test` recria o banco `gestao_test` a cada execução e não mexe no banco de desenvolvimento.

O banco de produção fica no Supabase ([docs/supabase.md](docs/supabase.md)) e a API roda no Render ([docs/deploy.md](docs/deploy.md)).

Tokens de curador e de estação: [docs/autenticacao.md](docs/autenticacao.md).

Como preparar e submeter um jogo: [docs/submissao.md](docs/submissao.md).

Catálogo, download para o fliperama e preview da curadoria: [docs/catalogo.md](docs/catalogo.md).

Aprovar e reprovar versões: [docs/curadoria.md](docs/curadoria.md).

Placares e votos (jogo → fliperama → API): [docs/placares.md](docs/placares.md).

Rankings de jogadores (por jogo) e de jogos, e anonimização: [docs/ranking.md](docs/ranking.md).

O que o G2, o G3 e o G4 precisam fazer para integrar: [docs/integracao.md](docs/integracao.md).

## Fluxo de branches

Segue o padrão da organização:

- `main` — estável, o que está em produção.
- `develop` — integração.
- `feature/*` — nasce de `develop` e volta por Pull Request.

Commits seguem Conventional Commits em português: `feat: adiciona ...`, `fix: corrige ...`, `docs: ...`, `test: ...`, `chore: ...`, `ci: ...`.
