# Placares e votos

Pela decisão da turma, **o apelido é digitado dentro do jogo**, no fim de cada partida. O caminho do placar é:

```
jogo (G4) ──postMessage PLACAR──▶ fliperama (G3) ──POST /api/placares──▶ API (G1)
                                   └─ pede a nota do jogo ao jogador
```

O ranking de jogadores é **por jogo** (não há ranking geral somando jogos).

## 1. O jogo envia `PLACAR` (G4)

No fim da partida, o jogo pede o apelido (A-Z e 0-9, até 9 caracteres) e manda a mensagem ao fliperama:

```js
window.parent.postMessage({
  tipo: 'PLACAR',
  jogo: 'jogo-exemplo',   // id do game.json
  versao: '1.1.0',
  jogador: 'ANA',         // apelido digitado no jogo
  pontos: 1450,
  duracao_s: 95,
  acertos: 8,
  erros: 2,
  tema: 'Matemática',
}, '*')
```

O [jogo-exemplo](https://github.com/Arcade-IFES/jogo-exemplo) tem uma tela de apelido pronta, que funciona só com joystick (↑ ↓ trocam a letra, → avança, ← apaga, Enter confirma).

## 2. O fliperama envia à API (G3)

O fliperama recebe a mensagem, pede a nota do jogo (1 a 5, opcional) e envia com o token da estação ([autenticacao.md](autenticacao.md)):

```http
POST /api/placares
Authorization: Bearer est_...
Content-Type: application/json

{
  "id_partida": "7d0f5c1e-2b1a-4c7e-9a51-3f0e8b2d4c10",
  "jogo": "jogo-exemplo",
  "jogador": "ANA",
  "pontos": 1450,
  "duracao_s": 95,
  "acertos": 8,
  "erros": 2,
  "tema": "Matemática",
  "jogado_em": "2026-09-23T14:30:00-03:00",
  "feedback": { "nota": 5, "comentario": "Muito bom" }
}
```

| Campo | Obrigatório | Observação |
| --- | --- | --- |
| `id_partida` | recomendado | UUID gerado pelo fliperama. **É o que evita duplicar** quando o envio é repetido; sem ele a API gera um e não há como deduplicar. |
| `jogo` | sim | `id` do jogo. `jogo_id` também é aceito. |
| `jogador` | não | Apelido vindo do jogo. Convertido para maiúsculas; precisa ser A-Z0-9, até 9. Sem ele, a partida fica como `ANON` e não entra no ranking. |
| `pontos` | sim | Número ≥ 0 (arredondado). |
| `duracao_s`, `acertos`, `erros` | não | Números ≥ 0; padrão 0. |
| `tema` | não | Padrão: o tema do jogo. |
| `jogado_em` | não | ISO 8601 com fuso; padrão: a hora em que a API recebeu. |
| `feedback` | não | `{ "nota": 1-5, "comentario": "..." }`. `nota` e `comentario` soltos também são aceitos. |

### Respostas

`201` para partida nova, `200` quando o `id_partida` já tinha sido recebido (nada é gravado de novo):

```json
{
  "ok": true,
  "duplicada": false,
  "partida": { "id_partida": "7d0f…", "jogo": "jogo-exemplo", "jogador": "ANA", "pontos": 1450, "…": "…" },
  "voto": { "nota": 5, "comentario": "Muito bom" }
}
```

**Reenvio seguro:** se a rede cair e o fliperama não souber se o envio chegou, basta reenviar o mesmo corpo com o mesmo `id_partida`.

| Status | `codigo` | Quando |
| --- | --- | --- |
| 400 | `REQUISICAO_INVALIDA` | Campo inválido (apelido fora da regra, nota fora de 1-5, sem `jogo`...) |
| 401 | `NAO_AUTENTICADO` / `TOKEN_INVALIDO` | Sem token de estação |
| 404 | `JOGO_NAO_ENCONTRADO` | O jogo não existe |
| 409 | `PARTIDA_CONFLITANTE` | O `id_partida` já foi usado em outro jogo |

`POST /api/resultados` aceita o mesmo corpo e é um alias **temporário**; migre para `/api/placares`.

## Votos

- Um voto por **(jogo, apelido)**: se o mesmo jogador votar de novo, o voto mais recente substitui o anterior.
- Partidas `ANON` podem votar, e esses votos não se substituem entre si.
- Os votos alimentam `nota_media`, `votos` e `feedbacks` no catálogo e no detalhe do jogo ([catalogo.md](catalogo.md)), e o ranking de jogos.
