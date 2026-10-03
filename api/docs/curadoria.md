# Curadoria

Toda versão submetida entra como `submetido` e só chega ao fliperama depois que um curador a aprova.

```
submetido ──aprovar──▶ aprovado ──(outra versão aprovada)──▶ substituida
    │
    └──reprovar──▶ reprovado   (o autor pode reenviar o mesmo número de versão)
```

## Fluxo no Portal (G2)

1. **Fila**: `GET /api/jogos?status=submetido`. Cada item traz o `versao_id` da versão pendente.
2. **Jogar antes de decidir**: abra o `preview_url` do item num iframe (veja [catalogo.md](catalogo.md#preview-curadoria--g2)).
3. **Decidir**: `POST /api/versoes/{versao_id}/decisao`, com o token do curador.

```http
POST /api/versoes/5c1d…/decisao
Authorization: Bearer cur_...
Content-Type: application/json

{ "decisao": "aprovado", "justificativa": "Jogável e com fontes." }
```

```json
{ "decisao": "reprovado", "justificativa": "A questão q3 está sem fonte verificável." }
```

- `decisao`: `aprovado` ou `reprovado`.
- `justificativa`: opcional para aprovar e **obrigatória para reprovar**. O autor vê o texto no histórico de versões.
- `curador`: se vier no corpo, é ignorado. Quem decidiu é sempre o dono do token, e o nome dele aparece em `decidido_por`.

A resposta `200` é o jogo (mesmo formato do catálogo), focando a versão decidida.

## O que muda ao aprovar

- A versão aprovada anterior do mesmo jogo vira `substituida`. Ela continua baixável por número (`/pacote?versao=`), mas sai do catálogo.
- Nome, descrição, autores, tema e demais dados do jogo passam a ser os do `game.json` da versão aprovada. Enquanto uma versão está pendente, o catálogo continua mostrando os dados da aprovada.
- O jogo aparece em `GET /api/jogos` e o `pacote_url` fica disponível para o fliperama.

## Erros

| Status | `codigo` | Quando |
| --- | --- | --- |
| 400 | `REQUISICAO_INVALIDA` | `decisao` diferente de `aprovado`/`reprovado`, ou id que não é UUID |
| 401 | `NAO_AUTENTICADO` / `TOKEN_INVALIDO` | Sem token de curador (token de estação não vale) |
| 404 | `VERSAO_NAO_ENCONTRADA` | A versão não existe |
| 409 | `VERSAO_JA_DECIDIDA` | A versão não está mais `submetido` |
| 409 | `VERSAO_ANTIGA` | A versão não é mais nova que a aprovada; reprove-a ou peça um número maior ao autor |
| 422 | `JUSTIFICATIVA_OBRIGATORIA` | Reprovação sem justificativa |

Duas decisões simultâneas na mesma versão não passam juntas: a segunda recebe `409 VERSAO_JA_DECIDIDA`.
