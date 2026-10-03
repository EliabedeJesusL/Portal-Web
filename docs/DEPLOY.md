# Deploy — API + Portal

São **dois serviços publicados separadamente**, igual ao G1 original: a API
não serve o Portal, cada um tem sua própria URL. O `render.yaml` na raiz já
descreve os dois.

## 1. A API (`api/`)

Siga **[`api/docs/deploy.md`](../api/docs/deploy.md)** — é a documentação
oficial do G1, já escrita para Render + Supabase, e não precisa de nenhuma
mudança. Resumo:

1. Crie o banco no Supabase (connection string do *Session pooler*, com
   `?sslmode=require`) — ver `api/docs/supabase.md`.
2. No Render: **New → Blueprint**, aponte para este repositório.
3. Preencha `DATABASE_URL` (obrigatório) e `GITHUB_TOKEN` (recomendado) nas
   variáveis do serviço `recreio-arcade-api`.
4. Depois do primeiro deploy, confira `https://<sua-api>.onrender.com/health`
   → deve responder `"banco":"ok"`.
5. Crie um curador de verdade (não use `dev-curador` em produção):
   ```bash
   DATABASE_URL="<connection string do Supabase>" npm run curador:criar -- "Nome do Curador"
   ```
   Rode isso do seu computador, dentro de `api/` — o token só aparece uma vez.

## 2. O Portal (`web/`)

O serviço `recreio-arcade-portal` no `render.yaml` já está configurado como
**site estático** (sem servidor rodando, só arquivos buildados). Depois que a
API estiver no ar:

1. No mesmo Blueprint do Render, edite a variável `VITE_API_BASE_URL` do
   serviço `recreio-arcade-portal` para a URL real da sua API
   (ex.: `https://recreio-arcade-api.onrender.com/api`).
2. Edite `CORS_ORIGINS` no serviço da API para incluir a URL do Portal
   (ex.: `https://recreio-arcade-portal.onrender.com`) — sem isso, o navegador
   bloqueia as chamadas por CORS.
3. Deploy.

Teste abrindo o Portal publicado e vendo se o catálogo carrega — se o
cabeçalho mostrar "API OFFLINE", confira o `VITE_API_BASE_URL` (ele é lido
**no momento do build**, então mudar a variável exige rodar o deploy de novo)
e o `CORS_ORIGINS` do lado da API.

## 3. Plano gratuito do Render "dorme"

Os dois serviços no plano free desligam depois de 15 minutos sem acesso. A
primeira requisição depois disso demora de 30 a 60 segundos. A API já tem um
workflow do GitHub Actions para isso
(`api/.github/workflows/manter-acordada.yml`); o Portal estático não dorme
(sites estáticos no Render não hibernam, só os `type: web`).
