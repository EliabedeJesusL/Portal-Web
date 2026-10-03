# Rankings

Rotas públicas, exceto a anonimização (curador).

## Ranking de jogadores (por jogo)

Pela decisão da turma, **cada jogo tem o seu ranking**; não existe ranking geral somando jogos.

```http
GET /api/ranking/jogadores?jogo=jogo-exemplo
GET /api/ranking/jogadores?jogo=jogo-exemplo&limite=10
```

- Vale a **melhor partida** de cada apelido naquele jogo.
- Empate em pontos: fica na frente quem fez a pontuação primeiro.
- Partidas `ANON` (sem apelido ou anonimizadas) não entram.
- `limite`: de 1 a 500; padrão 100.

```json
[
  {
    "posicao": 1,
    "apelido": "CAIO42",
    "pontos": 1800,
    "jogo_id": "jogo-exemplo",
    "jogo": "Quiz Invaders (exemplo)",
    "acertos": 18,
    "erros": 1,
    "duracao_s": 110,
    "jogado_em": "2026-09-23T14:05:00.000Z",
    "partidas": 3
  }
]
```

`acertos`, `erros`, `duracao_s` e `jogado_em` são da melhor partida; `partidas` é quantas vezes o apelido jogou aquele jogo.

| Status | `codigo` | Quando |
| --- | --- | --- |
| 400 | `REQUISICAO_INVALIDA` | Sem `?jogo=` |
| 404 | `JOGO_NAO_ENCONTRADO` | O jogo não existe |

**Portal (G2):** hoje `api.rankingJogadores()` pode ser chamado sem jogo; passe sempre o id do jogo.

## Ranking de jogos

```http
GET /api/ranking/jogos
```

Lista os jogos com versão aprovada, ordenados pela **nota ajustada** (média ponderada):

```
nota_ajustada = v/(v+m) · R + m/(v+m) · C
```

| Símbolo | Significado |
| --- | --- |
| `v` | votos do jogo |
| `R` | nota média do jogo |
| `m` | 5 (mínimo de votos para a nota do jogo pesar mais que a média geral) |
| `C` | média de todos os votos de todos os jogos (3 enquanto não houver voto) |

Assim, um jogo com um único voto 5 não passa um jogo com dez votos de média 4,8. Desempate: mais jogadores distintos, depois mais partidas.

```json
[
  {
    "posicao": 1,
    "jogo_id": "jogo-exemplo",
    "jogo": "Quiz Invaders (exemplo)",
    "nota": 4.8,
    "votos": 10,
    "partidas": 25,
    "jogadores_distintos": 12,
    "nota_ajustada": 4.7
  }
]
```

`nota` é a média simples (0 sem votos). `jogadores_distintos` não conta partidas `ANON`.

## Anonimização (curador)

A pedido de um jogador, troca o apelido dele por `ANON` nas partidas e nos votos. Ele sai dos rankings de jogadores; as notas continuam valendo para o ranking de jogos.

```http
POST /api/ranking/jogadores/anonimizar
Authorization: Bearer cur_...
Content-Type: application/json

{ "apelido": "ANA" }
```

`jogo` é opcional (`{ "apelido": "ANA", "jogo": "jogo-exemplo" }`) para anonimizar só num jogo; sem ele, vale para todos.

```json
{ "ok": true, "apelido_anterior": "ANA", "apelido_novo": "ANON", "partidas": 3, "votos": 1 }
```

A operação fica registrada (curador, data e quantidades), **sem guardar o apelido original**.

| Status | `codigo` | Quando |
| --- | --- | --- |
| 400 | `REQUISICAO_INVALIDA` | Apelido fora da regra, ou `ANON` |
| 401 | `NAO_AUTENTICADO` / `TOKEN_INVALIDO` | Sem token de curador |
| 404 | `APELIDO_NAO_ENCONTRADO` | Nenhuma partida ou voto com esse apelido |
| 404 | `JOGO_NAO_ENCONTRADO` | `jogo` informado não existe |
