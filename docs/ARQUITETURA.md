# Arquitetura — G1 (API) + G2 (Portal)

## Por que o `api/` é o código real do G1

Até esta versão, a API era uma reimplementação própria (Fastify + `pg` cru, sem
testes). Ela foi substituída pelo código-fonte real do G1
(`Arcade-IFES/Plataforma-Gestao-API`, branch `develop`), porque:

- já tem **151 testes automatizados** passando (`npm run test:api`), cobrindo
  catálogo, submissão, curadoria, ranking, placares, autenticação e erros;
- já valida pacotes de verdade (zip, `game.json`, mínimo de 20 questões, cada
  questão com fonte, tamanho máximo etc.) — a reimplementação anterior não
  baixava nem validava o conteúdo do repositório, só confiava na URL;
- o schema de resposta (`src/jogos/apresentacao.ts`) já foi desenhado para
  bater exatamente com o que `web/src/api.ts` espera — o próprio código
  comenta isso;
- documenta Swagger automaticamente, então a equipe tem uma forma visual de
  testar cada rota sem escrever código.

Ou seja: a parte do G1 não foi recriada do zero — foi **importada e validada**.
Isso é uma decisão arquitetural legítima: o professor atribuiu as duas partes
ao mesmo grupo, e o G1 real já é testado e documentado.

## As duas partes

```
api/     — Fastify + TypeScript + Drizzle ORM + PostgreSQL + Zod + Swagger
web/     — React + TypeScript + Vite + React Router
```

Nenhum dos dois lados duplica responsabilidade do outro:

| Responsabilidade | Onde vive |
| --- | --- |
| Validar o `game.json` e o pacote do jogo | `api/src/pacotes/validador.ts` |
| Baixar o repositório do GitHub | `api/src/github/cliente.ts` |
| Guardar jogos, versões, placares, votos | `api/src/db/schema/*.ts` (Postgres) |
| Calcular os rankings | `api/src/rankings/*.ts` |
| Autenticar curador/estação por token | `api/src/auth/*.ts` |
| Mostrar o catálogo, enviar formulário, aprovar/reprovar na tela | `web/src/pages/*.tsx` |
| Fazer as chamadas HTTP para a API | `web/src/api.ts` (único lugar que faz `fetch`) |

O Portal **não** recalcula nota, não decide se um jogo é válido, não guarda
nada sozinho — só exibe o que a API devolve e envia formulários para ela.

## Como os dados fluem — submissão até aparecer no catálogo

1. Alguém preenche `url do repositório` + `tag` no Portal (`web/src/pages/Enviar.tsx`).
2. O Portal manda `POST /api/jogos` (`web/src/api.ts` → `api.submeterJogo`).
3. A API resolve a tag num commit do GitHub, baixa o zip, valida `game.json`
   e `questoes.json`, e guarda tudo no Postgres com estado `submetido`
   (`api/src/routes/jogos.ts`).
4. Um curador loga no Portal com um token (`web/src/components/CuratorLogin.tsx`
   → `GET /api/curadores/eu`), abre a fila (`GET /api/jogos?status=submetido`),
   joga o preview (`GET /api/versoes/{id}/preview/`) e aprova ou reprova
   (`POST /api/versoes/{id}/decisao`).
5. Uma vez `aprovado`, o jogo aparece em `GET /api/jogos` (padrão do catálogo)
   e o Fliperama (G3) consegue baixar o pacote (`GET /api/jogos/{id}/pacote`).

## Como os placares voltam

1. O Fliperama manda `POST /api/placares` com `Authorization: Bearer <token de estação>`.
2. A API grava a partida; se o corpo trouxer `nota` (ou `feedback.nota`), grava
   o voto também (`api/src/placares/registrar.ts`).
3. O Portal mostra isso em `GET /api/ranking/jogadores?jogo=<id>`,
   `GET /api/ranking/jogos` e em `GET /api/jogos/{id}` (feedbacks e taxa de
   acerto por tema).

## Autenticação — dois tipos de token, nenhum guardado em texto puro

- **Curador** (`cur_...`): aprova/reprova jogos, anonimiza apelidos, cria
  estações. Validado em `GET /api/curadores/eu`.
- **Estação** (`est_...`): manda placares em nome de um fliperama específico.

Os dois são gerados com `crypto.randomBytes(32)`, e só o **hash SHA-256** fica
no banco (`api/src/auth/tokens.ts`) — o token em texto puro é mostrado uma
única vez, na criação, e não pode ser recuperado depois. Se perder, cria outro
e descarta o antigo.
