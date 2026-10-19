# Diagnóstico de produção — Recreio Arcade

## URLs corretas

- Portal (interface): `https://recreio-arcade-portal.onrender.com/`
- API (não é o site): `https://recreio-arcade-api.onrender.com/`
- Saúde da API e do banco: `https://recreio-arcade-api.onrender.com/health`
- Documentação da API: `https://recreio-arcade-api.onrender.com/docs`

O endereço raiz da API retorna JSON informativo; o portal é um serviço Render separado.

## Blueprint informa `unknown type "static"`

No `render.yaml` deste projeto, o portal deve estar definido assim:

```yaml
- type: web
  name: recreio-arcade-portal
  runtime: static
```

Não use `type: static`. Se o Render ainda reportar `unknown type "static"`, confira no Dashboard o repositório, a branch (`main`) e o caminho exato do Blueprint. Compare o arquivo aberto no GitHub com o arquivo que o Render está lendo; o erro normalmente indica que ele está lendo uma versão diferente ou antiga.

## Variáveis do serviço da API

- `NODE_ENV=production`
- `DATABASE_URL`: URI PostgreSQL do Supabase usando Session pooler, porta `5432`, com SSL (`?sslmode=require`).
- `CORS_ORIGINS`: origem pública exata do portal, sem caminho e sem barra final.
- `GITHUB_TOKEN`: opcional, mas recomendado para submissões via GitHub.

Não use a chave `anon` do Supabase como `DATABASE_URL`. Nunca comite a URI ou um `.env` com segredos.

## Variável do portal

`VITE_API_BASE_URL=https://recreio-arcade-api.onrender.com/api`

Essa variável é incorporada ao build do Vite. Depois de alterá-la, faça novo deploy do portal.

## Ordem de diagnóstico

1. Abra `/health`. Resposta esperada: HTTP 200 com `ok: true` e `banco: "ok"`.
2. Se retornar 503 `BANCO_INDISPONIVEL`, confira `DATABASE_URL`, senha, Session pooler e SSL nos logs da API.
3. Abra o portal. O cabeçalho deve mostrar `API ONLINE`.
4. Se aparecer `API OFFLINE`, confirme `VITE_API_BASE_URL`, faça novo deploy e confira `CORS_ORIGINS` na API.
5. Em Curadoria, entre com um token real criado no banco de produção. Não use tokens de demonstração.
6. Envie um jogo por repositório GitHub + `ref`, confira a fila pendente, aprove/reprove e valide a persistência.
7. Crie uma estação pela Curadoria e guarde o token exibido uma única vez para configurar o G3.

## Segurança após exposição de credencial

Se uma `DATABASE_URL` foi compartilhada em chat, issue, commit ou outro local acessível, altere a senha do banco no Supabase e atualize a variável no Render. Não reutilize a senha exposta.
