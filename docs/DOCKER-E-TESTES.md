# Docker, Swagger e como testar tudo

Tudo neste documento eu testei de verdade neste ambiente antes de te mandar o
projeto: subi um Postgres, rodei as migrações, rodei os 151 testes automáticos
da API, e testei ao vivo cada fluxo abaixo com `curl`. Os exemplos de
resposta são saídas reais, não inventadas.

## 1. Docker — para que serve aqui

O Docker só é usado para rodar o **Postgres local** (não para empacotar a API
ou o Portal). O arquivo é `api/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: gestao
      POSTGRES_PASSWORD: gestao
      POSTGRES_DB: gestao
    ports:
      - '5432:5432'
```

Comandos (defina na raiz do projeto, eles chamam `api/` por baixo):

```bash
npm run db:up      # docker compose up -d --wait — sobe o Postgres e espera ficar saudável
npm run db:down    # docker compose down — desliga e remove o container (mantém o volume)
```

Depois de `db:up`, confirme que subiu:

```bash
docker compose -f api/docker-compose.yml ps
```

Deve aparecer `recreio...postgres` com status `healthy`. Se der erro de porta
em uso, outro Postgres já está rodando na 5432 — pare ele ou mude a porta no
`docker-compose.yml` e no `DATABASE_URL` do `.env`.

**Importante**: o Docker aqui é só para o banco. A API e o Portal rodam
direto com `node`/`npm`, sem container — é assim que o `npm run dev` espera.

## 2. Preparando o ambiente (uma vez)

```bash
npm run install:all
cp api/.env.example api/.env
npm run db:up
npm run db:migrate
npm run db:seed
```

O `db:seed` cria dois jogos de exemplo (`quiz-invaders` aprovado,
`labirinto-da-historia` ainda `submetido`), partidas, votos, e imprime:

```
Seed aplicado.
  Token de curador (dev): dev-curador
  Token de estação (dev): dev-estacao
```

Guarde esses dois tokens — você vai usar os dois nos testes abaixo.

## 3. Subindo tudo

```bash
npm run dev
```

Isso sobe a API (`localhost:3000`) e o Portal (`localhost:5173`) juntos, com
log colorido (azul = api, magenta = web) no mesmo terminal.

## 4. Swagger — testar a API sem escrever código

Abra **http://localhost:3000/docs**. É a mesma interface do G1 em produção
(https://plataforma-gestao-api.onrender.com/docs), só que apontando para o seu
banco local.

Passo a passo de uma chamada:

1. Clique na rota, ex. `GET /api/jogos`.
2. Clique **Try it out**.
3. Preencha os parâmetros (se houver) e clique **Execute**.
4. O corpo da resposta aparece embaixo, com o status HTTP.

Para rotas protegidas (ícone de cadeado, ex. `POST /api/versoes/{id}/decisao`):

1. Clique no cadeado no topo da página (ou em qualquer rota protegida).
2. Cole o token **sem** a palavra `Bearer` — o Swagger adiciona isso sozinho.
   Para testar local: `dev-curador` ou `dev-estacao`.
3. **Authorize** → **Close**. Agora toda chamada protegida leva o token.

## 5. Testando cada fluxo manualmente

### 5.1 Saúde da API

```bash
curl http://localhost:3000/health
```
Esperado:
```json
{"ok":true,"service":"plataforma-gestao-api","status":"ok","banco":"ok"}
```
Se `banco` não aparecer ou vier erro 503, o Postgres não está acessível —
confira o `db:up` e o `DATABASE_URL` do `.env`.

### 5.2 Catálogo

```bash
curl http://localhost:3000/api/jogos
```
Esperado: uma lista com `quiz-invaders` (o `labirinto-da-historia` não aparece
aqui porque está `submetido`, não `aprovado`). Repare nos campos `capa_url` e
`preview_url` — são URLs completas servidas pela própria API
(`/api/versoes/{id}/preview/...`), o Portal só usa elas direto num `<img>`.

No Portal: abra `/catalogo` e confira que o card do Quiz Invaders aparece com
nota, tema e nível.

### 5.3 Detalhe, feedback e taxa de acerto

```bash
curl http://localhost:3000/api/jogos/quiz-invaders
```
Esperado (resumido): `feedbacks` com 3 entradas (ANA, BRUNO, CAIO42) e
`taxa_acerto_tema` com uma linha de Matemática por volta de 88-89% de acerto.

### 5.4 Submissão (via GitHub de verdade)

```bash
curl -X POST http://localhost:3000/api/jogos \
  -H "Content-Type: application/json" \
  -d '{"repositorio_url":"https://github.com/Arcade-IFES/jogo-exemplo","ref":"v1.1.0","resumo":"Teste"}'
```
Esperado: `201`, corpo com `"status":"submetido"` e `"id":"jogo-exemplo"`. Essa
chamada baixa o repositório de verdade do GitHub a cada teste — o GitHub limita
chamadas sem token a **60 por hora por IP**. Se vier
`"codigo":"GITHUB_INDISPONIVEL"` com "limite de requisições atingido", espere
a hora resetar ou defina `GITHUB_TOKEN` no `api/.env` (sobe o limite para
5000/hora — veja `api/docs/submissao.md`). **Isso foi exatamente o que
aconteceu comigo neste ambiente**: usei a cota testando outras coisas do
GitHub antes de chegar aqui, então não consegui te mostrar o 201 ao vivo desta
rota especificamente — mas validei a mesma lógica de duas outras formas:
os 151 testes automatizados da API (`api/test/github.test.ts`, 21 testes,
simulam exatamente essa chamada) passaram, e confirmei o `game.json` real
desse repositório bate com o que o validador exige.

No Portal: `/enviar`, cole a mesma URL e tag, confira a mensagem de sucesso e
depois que o jogo aparece na fila de Curadoria.

### 5.5 Curadoria

Login do curador:
```bash
curl http://localhost:3000/api/curadores/eu -H "Authorization: Bearer dev-curador"
```
Esperado: `{"id":"...","nome":"Curador Dev"}`. Com token errado, vem
`401 TOKEN_INVALIDO`.

Fila:
```bash
curl "http://localhost:3000/api/jogos?status=submetido"
```
Pegue o `versao_id` do jogo que quiser decidir.

Reprovar sem justificativa (deve falhar):
```bash
curl -X POST http://localhost:3000/api/versoes/<versao_id>/decisao \
  -H "Authorization: Bearer dev-curador" -H "Content-Type: application/json" \
  -d '{"decisao":"reprovado"}'
```
Esperado: `422 JUSTIFICATIVA_OBRIGATORIA`.

Aprovar:
```bash
curl -X POST http://localhost:3000/api/versoes/<versao_id>/decisao \
  -H "Authorization: Bearer dev-curador" -H "Content-Type: application/json" \
  -d '{"decisao":"aprovado","justificativa":"ok"}'
```
Esperado: `200`, `"status":"aprovado"`.

No Portal: `/moderacao`, cole `dev-curador`, veja o jogo pendente, clique no
preview (deve abrir o jogo rodando num iframe), aprove ou reprove.

### 5.6 Placar (simulando o Fliperama)

```bash
curl -X POST http://localhost:3000/api/placares \
  -H "Authorization: Bearer dev-estacao" -H "Content-Type: application/json" \
  -d '{"id_partida":"<um-uuid-novo>","jogo":"quiz-invaders","jogador":"ABC123","pontos":500,"duracao_s":30,"acertos":5,"erros":1,"tema":"Matemática","nota":5}'
```
Esperado: `201`, `"duplicada":false`. Reenviando o **mesmo** `id_partida`,
vem `200` com `"duplicada":true` e nada é gravado de novo — é assim que o
Fliperama pode reenviar sem medo de duplicar. **Atenção ao nome do campo**:
é `jogador`, não `apelido` (só `/api/ranking/jogadores/anonimizar` usa
`apelido`). Mandar `apelido` por engano não dá erro — o campo é ignorado e o
jogador vira `ANON` (foi o que aconteceu comigo na primeira tentativa).

### 5.7 Rankings

```bash
curl "http://localhost:3000/api/ranking/jogadores?jogo=quiz-invaders"
curl "http://localhost:3000/api/ranking/jogadores"   # sem ?jogo= → 400 de propósito
curl "http://localhost:3000/api/ranking/jogos"
```
No ranking de jogos, repare no jogo sem nenhum voto ainda: a `nota_ajustada`
dele não fica em 0, fica igual à média global — é a fórmula puxando o jogo
pouco avaliado para a média, em vez de deixá-lo artificialmente no topo ou no
fundo.

### 5.8 Anonimização

```bash
curl -X POST http://localhost:3000/api/ranking/jogadores/anonimizar \
  -H "Authorization: Bearer dev-curador" -H "Content-Type: application/json" \
  -d '{"apelido":"ABC123","jogo":"quiz-invaders"}'
```
Esperado: `{"ok":true,"apelido_anterior":"ABC123","apelido_novo":"ANON", ...}`.
No Portal, o botão **ANONIMIZAR** só aparece com um curador logado.

## 6. Rodando a suíte de testes automatizada

```bash
npm run test:api
```
Esperado: `14 passed (14)` arquivos, `151 passed (151)` testes. Esses testes
não usam o Postgres do `db:up` — eles recriam o banco `gestao_test` sozinhos a
cada execução (configurado em `api/test/support/global-setup.ts`), então rodar
`npm run test:api` nunca mexe nos dados do seu `db:seed`.

## 7. Erros de propósito, para você reconhecer na hora da apresentação

| O que fazer | Status | `codigo` |
| --- | --- | --- |
| Repositório que não existe | 422 | `REPOSITORIO_INVALIDO` |
| Tag que não existe | 422 | `REF_NAO_ENCONTRADA` |
| Reprovar sem justificativa | 422 | `JUSTIFICATIVA_OBRIGATORIA` |
| Decidir a mesma versão duas vezes | 404 (não existe mais como `submetido`) | `VERSAO_NAO_ENCONTRADA` |
| Token ausente numa rota protegida | 401 | `NAO_AUTENTICADO` |
| Token errado | 401 | `TOKEN_INVALIDO` |
| Ranking de jogadores sem `?jogo=` | 400 | `REQUISICAO_INVALIDA` |
| Mais de 10 submissões em 10 min do mesmo IP | 429 | `MUITAS_REQUISICOES` |

Todo erro da API tem sempre esse formato: `{"codigo": "...", "erro": "mensagem"}`.
