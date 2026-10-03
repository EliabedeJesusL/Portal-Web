# O que o Fliperama (G3) precisa

A referência completa já existe em
**[`api/docs/integracao.md`](../api/docs/integracao.md)** (seção "G3 —
Fliperama") — este arquivo é só um resumo rápido para a conversa com o outro
grupo.

## 1. Um token de estação

Cada fliperama precisa de um token `est_...`, criado por um curador (o G2 tem
esse token, não o G3):

```bash
curl -X POST http://localhost:3000/api/estacoes \
  -H "Authorization: Bearer dev-curador" -H "Content-Type: application/json" \
  -d '{"nome":"Fliperama 1"}'
```
A resposta traz o `token` **uma única vez** — entregue ao G3 por um canal
privado (não por commit, não por chat público).

## 2. Sincronizar o catálogo

- `GET /api/jogos` lista os aprovados, cada um com `sha256` e `pacote_url`.
- Baixa de novo só se o `sha256` mudou. Com `If-None-Match: "<sha256>"`, a API
  responde `304` sem reenviar o zip.
- O zip de `pacote_url` já vem com o jogo na raiz (`index.html`, `game.json`,
  `questoes.json`, capa).

## 3. Enviar placares

```http
POST /api/placares
Authorization: Bearer est_...
Content-Type: application/json

{
  "id_partida": "<uuid gerado pelo fliperama>",
  "jogo": "jogo-exemplo",
  "jogador": "ANA",
  "pontos": 1450,
  "duracao_s": 95,
  "acertos": 8,
  "erros": 2,
  "tema": "Matemática",
  "jogado_em": "2026-09-27T14:30:00-03:00",
  "feedback": { "nota": 5, "comentario": "..." }
}
```

- `201` partida nova, `200` se o mesmo `id_partida` já tinha chegado (seguro
  reenviar se a rede falhar no meio do caminho).
- O apelido (`jogador`) é digitado **dentro do jogo**, não no fliperama — é a
  decisão da turma de 23/09. O fliperama só repassa o que o jogo mandou por
  `postMessage`.
- `/api/resultados` ainda funciona como alias de `/api/placares`, mas é
  temporário — use `/api/placares` em código novo.

## 4. Testando a integração

O [`jogo-exemplo`](https://github.com/Arcade-IFES/jogo-exemplo) já está
aprovado neste projeto (via `npm run db:seed`, como `quiz-invaders`) e serve
de modelo: baixe, rode, confira que o placar chega em
`GET /api/ranking/jogadores?jogo=quiz-invaders` depois de jogar.
