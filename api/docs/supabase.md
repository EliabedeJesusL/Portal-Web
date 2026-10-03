# Banco em produção (Supabase)

Em produção a API usa só o **Postgres** do Supabase. Nenhum outro recurso (Auth, Storage, Edge Functions) é usado, e o código lê apenas a variável `DATABASE_URL`. Para trocar de provedor (Aiven, Neon etc.), basta mudar essa variável.

## 1. Pegar a connection string

1. Abra o projeto no [painel do Supabase](https://supabase.com/dashboard).
2. Clique em **Connect** (topo da página).
3. Escolha **Session pooler** e copie a URI. Ela tem este formato:

   ```
   postgresql://postgres.<ref-do-projeto>:[YOUR-PASSWORD]@aws-0-<região>.pooler.supabase.com:5432/postgres
   ```

4. Troque `[YOUR-PASSWORD]` pela senha do banco. Se esqueceu, gere outra em **Project Settings → Database → Reset database password**.
5. Acrescente `?sslmode=require` ao final, para a conexão sempre usar SSL:

   ```
   postgresql://postgres.<ref-do-projeto>:<senha>@aws-0-<região>.pooler.supabase.com:5432/postgres?sslmode=require
   ```

Caracteres especiais na senha precisam ser codificados na URL: `@` → `%40`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`.

**Por que o Session pooler?** A conexão direta (`db.<ref>.supabase.co`) só funciona por IPv6, que o Render não tem. O Transaction pooler (porta 6543) não suporta prepared statements, que o driver `postgres` usa. O Session pooler funciona por IPv4 e suporta os dois.

## 2. Aplicar as migrações

As migrações ficam em `drizzle/` e são aplicadas em ordem; rodar de novo não faz nada.

```bash
DATABASE_URL="postgresql://postgres.<ref>:<senha>@aws-0-<região>.pooler.supabase.com:5432/postgres?sslmode=require" npm run db:migrate
```

No Render, as migrações rodam sozinhas a cada inicialização do serviço (`npm run db:migrate:prod`); veja [docs/deploy.md](deploy.md).

**Não rode `npm run db:seed` em produção.** Ele cria tokens de desenvolvimento conhecidos e por isso se recusa a rodar contra um banco que não seja local.

## 3. Configurar a API

Defina `DATABASE_URL` com a mesma string:

- **Local, apontando para o Supabase:** no arquivo `.env` (que não vai para o git).
- **Render:** em **Environment → Environment Variables** do Web Service.

Para conferir, `GET /health` responde `{"ok":true,...,"banco":"ok"}` quando a conexão funciona e `503` com `BANCO_INDISPONIVEL` quando não.

## Alterando o schema

1. Edite os arquivos em `src/db/schema/`.
2. Gere a migração: `npm run db:generate -- --name descricao-curta`.
3. Revise o SQL gerado em `drizzle/` e commite junto com o schema.
4. Nunca edite uma migração que já foi aplicada em produção; crie outra.
