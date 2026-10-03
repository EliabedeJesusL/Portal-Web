# Autenticação

A API usa tokens no cabeçalho `Authorization`:

```
Authorization: Bearer <token>
```

Só o hash SHA-256 de cada token fica no banco. O token em texto é mostrado **uma única vez**, quando é criado; se for perdido, é preciso criar outro.

| Quem | Prefixo | Como é criado | Usa em |
| --- | --- | --- | --- |
| Curador | `cur_` | Script `npm run curador:criar` | Curadoria, estações, anonimização |
| Estação (fliperama) | `est_` | `POST /api/estacoes`, por um curador | Envio de placares |

Submeter jogos e consultar catálogo e rankings não exige token.

## Erros

| Status | `codigo` | Quando |
| --- | --- | --- |
| 401 | `NAO_AUTENTICADO` | Sem o cabeçalho, ou fora do formato `Bearer <token>` |
| 401 | `TOKEN_INVALIDO` | Token desconhecido, ou de outro tipo (ex.: token de estação numa rota de curador) |

## Criar um curador

```bash
npm run curador:criar -- "Nome do Curador"
```

O script usa a `DATABASE_URL` do ambiente ou do `.env` e mostra o host do banco antes de criar. Para criar um curador em produção, rode com a `DATABASE_URL` do Supabase.

## Portal (G2): login do curador

O curador cola o token no Portal. Para validar e mostrar o nome:

```http
GET /api/curadores/eu
Authorization: Bearer cur_...
```

```json
{ "id": "3f0c…", "nome": "Nome do Curador" }
```

## Fliperama (G3): token da estação

Um curador cria a estação uma vez e configura o token no fliperama:

```http
POST /api/estacoes
Authorization: Bearer cur_...
Content-Type: application/json

{ "nome": "Fliperama do bloco A" }
```

```json
{
  "id": "9b1e…",
  "nome": "Fliperama do bloco A",
  "token": "est_…",
  "criado_em": "2026-09-23T13:40:00.000Z"
}
```

A partir daí, o fliperama envia `Authorization: Bearer est_…` em `POST /api/placares`.

`GET /api/estacoes` (curador) lista as estações, sem os tokens.

## Desenvolvimento

O `npm run db:seed` cria o curador `dev-curador` e a estação `dev-estacao`, com esses textos como tokens. Eles só existem no banco local.
