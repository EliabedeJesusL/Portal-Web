# Plano de execução — API da Plataforma de Gestão (G1)

> Atualizado em 23/09/2026. Entrega E2: **28/09/2026**.

## Onde estamos

Os 9 passos do plano foram entregues e estão em produção desde 23/09, adiantados em relação ao cronograma. Falta a release final, a integração com os outros grupos e a verificação em produção do placar chegando ao ranking.

| Passo | Branch | Estado | PR → `develop` | Release → `main` |
| --- | --- | --- | --- | --- |
| 0 | `main` / `develop` | ✅ Repositório na org [Arcade-IFES/Plataforma-Gestao-API](https://github.com/Arcade-IFES/Plataforma-Gestao-API) | — | — |
| 1 | `feature/estrutura-base` | ✅ Em produção | #1 | #4 |
| 2 | `feature/banco-de-dados` | ✅ Em produção | #2 | #4 |
| 3 | `feature/autenticacao` | ✅ Em produção | #5 | #6 |
| 4 | `feature/submissao-repositorio` | ✅ Em produção | #7 | #8 |
| 5 | `feature/catalogo-e-pacote` | ✅ Em produção | #9 | #10 |
| 6 | `feature/curadoria` | ✅ Em produção | #11 | #12 |
| 7 | `feature/placares` | ✅ Em produção | #13 | #14 |
| 8 | `feature/rankings` | ✅ Em produção | #15 | #16 |
| 9 | `feature/deploy` | ✅ Em produção | #3, #17 | #18 |
| R | `develop` → `main` | ⏳ Pendente: release v0.1.0 com revisão | — | — |

Cada passo foi para produção logo depois de entrar no `develop` (releases v0.0.1 a v0.0.8), em vez de esperar a release final. As branches `feature/*` são apagadas depois do merge.

**Produção:**

- API: <https://plataforma-gestao-api.onrender.com> (Render, plano free, deploy automático do `main`).
- Swagger: <https://plataforma-gestao-api.onrender.com/docs>.
- Banco: Supabase (Postgres 17, `us-east-1`), via Session pooler com `sslmode=require`.
- Curador de produção: **Murilo**, criado com `npm run curador:criar`.
- Jogo publicado: [`jogo-exemplo`](https://github.com/Arcade-IFES/jogo-exemplo) **1.1.0** aprovado. A 1.0.0 ficou `substituida`, o que testou a troca de versão em produção.
- `GITHUB_TOKEN` configurado no Render. Sem ele, as submissões esgotavam o limite do GitHub.
- Workflow `manter-acordada.yml` chama `/health` a cada 5 minutos para o Render não desligar a API.

**Requisitos da E2 em produção:**

| Requisito | Estado |
| --- | --- |
| Submissão → curadoria → download | ✅ Testado com o `jogo-exemplo` (submissão pelo GitHub, aprovação, download com sha256 conferido, `304` com `If-None-Match`) |
| Um jogo publicado | ✅ `jogo-exemplo` 1.1.0 |
| Placar chegando ao ranking | 🟡 Funciona localmente e nos testes; em produção, espera o G3 enviar a primeira partida |
| URL de produção | ✅ |

**Pendências:**

- Release v0.1.0 (`develop` → `main`) com revisão de outra pessoa do grupo.
- Integração com o G2, o G3 e o G4: o que cada um precisa fazer está em [integracao.md](integracao.md).
- **Trocar a senha do banco no Supabase**: a atual é fraca e já apareceu em conversa. Atualizar no `.env` e no Render.
- O repositório antigo `MuriloDiazs/Plataforma-Gestao-API` ainda existe e pode ser apagado.

## Contexto

O G1 é dono da API oficial e do banco do Recreio Arcade. O Portal (G2) e o fliperama (G3) rodavam sobre mocks. A E2 exige, em produção:

- submissão → curadoria → download funcionando;
- um jogo publicado;
- placar chegando ao ranking;
- uma URL de produção.

**Decisões:**

- Repositório na org: `Arcade-IFES/Plataforma-Gestao-API`.
- Fastify + TypeScript, a mesma stack do mock do G2.
- Submissão por **link do repositório GitHub**, sem upload de `.zip`.
- Banco: **Supabase, só Postgres**. O código lê apenas `DATABASE_URL`, então dá para trocar para o Aiven só mudando essa variável.
- API no **Render**. Hospedar no Supabase foi avaliado e descartado: as Edge Functions exigiriam reescrever a API em Deno, e os limites de CPU e memória ameaçam justamente a submissão de zips de até 20 MB.

**Decisão da turma (23/09), que muda o plano original:**

- **O apelido é digitado dentro do jogo**, no fim de cada partida, e não no fliperama. O jogo o envia no campo `jogador` da mensagem `PLACAR`.
- O placar vai do **jogo → fliperama (postMessage) → API** (`POST /api/placares`, com o token da estação).
- A **nota do jogo (1 a 5)** continua sendo pedida pelo **fliperama**.
- **Cada jogo tem o seu ranking.** Não existe ranking geral de jogadores somando jogos.
- O apelido mantém a regra A-Z0-9, com até 9 caracteres.

A fonte do contrato é a [especificação do professor](https://paulossjunior.github.io/aula-extensao/trabalho/recreio-arcade/).

## Arquitetura

- **Stack:** Fastify 5, TypeScript, Zod (mensagens em pt-BR), Drizzle ORM com migrações SQL, driver `postgres`, `fflate` para os zips e Vitest.
- **Testes:** 151 testes com Postgres real, via `docker compose` localmente e `services: postgres` no CI. O GitHub é substituído por um cliente falso nos testes.
- **Documentação:** guias por tema em `docs/` e Swagger gerado dos schemas em `/docs`.

**Submissão por link:**

- O autor informa `repositorio_url` e `ref` (tag, ex.: `v1.0.0`).
- A API resolve a ref para o SHA do commit, baixa o zip desse commit pelo codeload do GitHub (limite de 20 MB), remove a pasta raiz que o GitHub coloca, valida o conteúdo e **reempacota** com o jogo na raiz e data fixa.
- O zip fica no Postgres (tabela `pacotes`). O `sha256` é estável, e a API é a única fonte do download para o G3.
- Os metadados do jogo (nome, tema etc.) só mudam quando uma versão nova é **aprovada**.

**Validação**, com os códigos do contrato e uma mensagem do que corrigir:

- `SEM_INDEX`, `SEM_MANIFESTO`, `MANIFESTO_INVALIDO`, `PACOTE_GRANDE` (20 MB compactado ou 100 MB descompactado), `POUCAS_QUESTOES` (menos de 20), `QUESTAO_SEM_FONTE`, `ID_EM_USO`.
- Mais `REPOSITORIO_INVALIDO`, `REF_NAO_ENCONTRADA`, `PACOTE_INVALIDO`, `VERSAO_JA_SUBMETIDA` e `GITHUB_INDISPONIVEL`.

**Preview da curadoria:** `GET /api/versoes/{id}/preview/*` serve os arquivos de dentro do zip guardado, isolados por `CSP sandbox`. As versões abertas por último ficam em cache de memória (até 64 MB).

**Autenticação:** token Bearer (`cur_...` ou `est_...`), com só o hash SHA-256 guardado no banco. A autenticação roda antes da validação, então uma requisição sem token recebe `401`.

- **Curadores:** criados por `npm run curador:criar -- "Nome"`, que imprime o token uma vez.
- **Estações:** criadas por `POST /api/estacoes`, que devolve o token uma vez.
- **Submissão:** pública, com rate limit de 10 por IP a cada 10 minutos.

**Erros:** formato `{ "codigo": "...", "erro": "mensagem" }`, compatível com o Portal, inclusive os erros do próprio Fastify, traduzidos.

**Campos das respostas:** os mesmos que o Portal consome em `Portal-Web/web/src/api.ts`, mais URLs absolutas (`capa_url`, `preview_url`, `pacote_url`).

### Rotas

| Rota | Auth | Observação |
| --- | --- | --- |
| `GET /health`, `GET /api/health` | pública | checa o banco; inclui `ok` e `service`, que o Portal lê |
| `POST /api/jogos` | pública + rate limit | `{repositorio_url, ref, resumo?}`; os metadados vêm do `game.json` |
| `GET /api/jogos?status=` | pública | catálogo (padrão `aprovado`) e fila da curadoria (`submetido`) |
| `GET /api/jogos/{id}` | pública | versões, feedbacks, taxa de acerto por tema |
| `GET /api/jogos/{id}/pacote?versao=` | pública | zip com `ETag`, `X-Sha256` e `304`; só versões aprovadas ou substituídas |
| `GET /api/versoes/{id}/preview/*` | pública | arquivos do jogo para o iframe da curadoria |
| `POST /api/versoes/{id}/decisao` | curador | 409 se já decidida ou se for mais antiga que a aprovada; ao aprovar, a aprovada anterior vira `substituida` |
| `GET /api/curadores/eu` | curador | valida o token no login do Portal |
| `POST /api/estacoes`, `GET /api/estacoes` | curador | token mostrado uma vez |
| `POST /api/placares` | estação | 201 para partida nova, 200 para repetida; voto em upsert por (jogo, apelido); sem apelido, `ANON` |
| `POST /api/resultados` | estação | alias temporário para o G3 |
| `GET /api/ranking/jogadores?jogo=` | pública | **`jogo` obrigatório** (decisão da turma) |
| `GET /api/ranking/jogos` | pública | nota ajustada |
| `POST /api/ranking/jogadores/anonimizar` | curador | troca o apelido por `ANON`, em todos os jogos ou num só |
| `GET /docs` | pública | OpenAPI/Swagger |

**Rankings:**

- **Jogadores (por jogo):** conta a melhor partida de cada apelido naquele jogo. No empate, fica na frente quem fez primeiro. Partidas `ANON` ficam de fora. Não há ranking geral.
- **Jogos:** `nota_ajustada = v/(v+m)·R + m/(v+m)·C`, com m = 5 e C igual à média global (3 sem votos). O desempate é por jogadores distintos e depois por número de partidas.

### Banco

| Tabela | Campos principais |
| --- | --- |
| `jogos` | id (slug do `game.json`), nome, descricao, resumo, autores[], controles, classico_referencia, mecanica, tema, nivel, capa, repositorio_url |
| `versoes` | id, jogo_id, versao, estado, ref, commit_sha, tamanho_bytes, sha256, manifesto, total_questoes, decidido_por, justificativa; uma aprovada por jogo; número único por jogo, exceto reprovadas |
| `pacotes` | versao_id, conteudo (bytea) |
| `partidas` | id_partida (PK, garante o dedup), jogo_id, jogador (A-Z0-9, até 9), pontos, duracao_s, acertos, erros, tema, jogado_em, estacao_id |
| `votos` | jogo_id, jogador, id_partida, nota (1 a 5), comentario; único por (jogo, jogador), exceto `ANON` |
| `estacoes`, `curadores` | id, nome, token_hash |
| `anonimizacoes` | log das anonimizações (curador, jogo, quantidades), sem o apelido original |

## Fluxo de git

- **Branches:** `main` é estável, `develop` é integração, e cada `feature/*` nasce de `develop` e volta por PR.
- **Commits:** Conventional Commits em português, no formato `tipo: descrição em minúsculas`.
- **PRs para `develop`:** entram depois do CI verde.
- **PR `develop` → `main`:** precisa de revisão de outra pessoa do grupo. As releases intermediárias (v0.0.x) foram mergeadas sem revisão, para adiantar o deploy.

| # | Branch | Commits | PR |
| --- | --- | --- | --- |
| 1 | `feature/estrutura-base` | configura typescript e fastify · validação do env · health · formato de erro · testes · CI | feat: estrutura base da API |
| 2 | `feature/banco-de-dados` | docker compose · schema de jogos, versões e pacotes · schema de partidas, votos, estações e curadores · migração · seed · docs do Supabase | feat: banco de dados e migrações |
| 3 | `feature/autenticacao` | tokens com hash · script de curador · rotas de estações · testes | feat: autenticação de curadores e estações |
| 4 | `feature/submissao-repositorio` | cliente do GitHub · validador de pacote · rota de submissão · testes | feat: submissão de jogo por link do GitHub |
| 5 | `feature/catalogo-e-pacote` | catálogo e detalhe · download com etag · preview · testes | feat: catálogo, download e preview |
| 6 | `feature/curadoria` | decisão com máquina de estados · testes | feat: curadoria de versões |
| 7 | `feature/placares` | placares com dedup · votos · alias `/api/resultados` · testes | feat: ingestão de placares e votos |
| 8 | `feature/rankings` | ranking de jogadores · ranking de jogos · anonimização · testes | feat: rankings e anonimização |
| 9 | `feature/deploy` | cors, rate limit e openapi · `render.yaml` · docs de deploy · ping do Render | chore: preparação para deploy |
| R | `develop` → `main` | — | release: v0.1.0 — entrega E2 |

## Cronograma

| Dia | Previsto | Realizado |
| --- | --- | --- |
| 23/09 | Passos 0 a 3 | ✅ Passos 0 a 9, deploy e `jogo-exemplo` publicado |
| 24/09 | Passos 4 e 5 | — |
| 25/09 | Passos 6 a 8 | — |
| 26/09 | Passo 9 e deploy | Release v0.1.0 |
| 27/09 | Integração com o G2 e o G3 | Integração com o G2, o G3 e o G4 |
| 28/09 | Entrega E2 | — |

Com a folga, dá para adiantar a integração.

## Riscos para os outros grupos

- **G4:**
  - Nenhum jogo atual da org passa na validação. O Snake não tem `game.json`, e os outros não têm `index.html` na raiz. Todos precisam de `index.html`, `game.json` e `questoes.json` na raiz, com 20 questões com fonte ([docs/submissao.md](submissao.md)).
  - **Os jogos precisam pedir o apelido no fim da partida** e mandar `jogador` no `PLACAR`.
  - O [`jogo-exemplo`](https://github.com/Arcade-IFES/jogo-exemplo) serve de modelo para os dois pontos.
- **G3:**
  - Precisa criar a estação (`POST /api/estacoes` com um token de curador), mandar `Authorization: Bearer <token da estação>` e usar `/api/placares`.
  - Deve repassar o `jogador` que vem no `PLACAR` do jogo, pedir a nota e mandar um `id_partida` (UUID) para o reenvio ser seguro.
  - O alias `/api/resultados` fica só durante a transição.
  - A sincronização sugerida (sha256, `If-None-Match`) está em [docs/catalogo.md](catalogo.md).
- **G2:**
  - O formulário de submissão passa a mandar só `repositorio_url`, `ref` e `resumo`.
  - O login de curador pode usar `GET /api/curadores/eu` com o token.
  - `rankingJogadores()` precisa passar sempre o `jogo`.
  - A decisão usa o token, e o campo `curador` do corpo é ignorado.
  - Os erros de validação vêm como `422`.

## Verificação

- `npm run build` e `npm test` verdes em cada PR, e o CI verde antes de cada merge. ✅
- Teste de ponta a ponta local: ✅ feito em cada passo.
  1. Criar um curador.
  2. Submeter um repositório de teste válido.
  3. Conferir que um repositório sem manifesto dá `SEM_MANIFESTO` (o Snake dá).
  4. Aprovar a versão.
  5. Baixar o pacote e conferir o sha256.
  6. Criar uma estação e enviar o mesmo placar duas vezes: a primeira deve dar 201 e a segunda 200.
  7. Conferir os rankings.
- Em produção:
  - ✅ `GET /health` responde 200 com `"banco":"ok"`.
  - ✅ Passos 1 a 5 com o `jogo-exemplo`, incluindo a troca de versão 1.0.0 → 1.1.0.
  - ⏳ Passos 6 e 7 com o G3.
- ⏳ Portal G2 apontado para a produção: catálogo, detalhe, curadoria e rankings carregam.
