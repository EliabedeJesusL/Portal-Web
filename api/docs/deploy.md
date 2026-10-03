# Deploy no Render

A API roda como **Web Service** no Render, configurado pelo [`render.yaml`](../render.yaml) na raiz (Blueprint). O banco é o Postgres do Supabase ([docs/supabase.md](supabase.md)).

| Item | Valor |
| --- | --- |
| Branch | `main`, com deploy automático a cada merge |
| Plano | free |
| Região | Virginia (US East), a mais próxima do Supabase em São Paulo |
| Build | `npm ci --include=dev && npm run build` |
| Start | `npm run db:migrate:prod && npm start` |
| Health check | `GET /health` |

## Criar o serviço (uma vez)

1. Entre no [Render](https://dashboard.render.com) com uma conta do GitHub que tenha acesso à org **Arcade-IFES**.
2. **New → Blueprint**.
3. Conecte o GitHub e dê acesso ao repositório `Arcade-IFES/Plataforma-Gestao-API`. Se a org não aparecer, clique em **Configure account** e instale o app do Render na org.
4. Escolha o repositório e a branch `main`. O Render lê o `render.yaml` e mostra o serviço `plataforma-gestao-api`.
5. Preencha `DATABASE_URL` com a connection string do Session pooler do Supabase, terminando em `?sslmode=require`.
6. **Apply**. O primeiro deploy roda o build, aplica as migrações e sobe a API.
7. Confira `https://plataforma-gestao-api.onrender.com/health` (o Render mostra a URL exata no topo do serviço). Deve responder com `"banco":"ok"`.

O `render.yaml` só é lido da branch `main`. Enquanto ele não estiver no `main`, o Blueprint não encontra o arquivo.

## Variáveis opcionais

Adicione em **Environment** no serviço:

| Variável | Padrão | Para quê |
| --- | --- | --- |
| `GITHUB_TOKEN` | — | Sobe o limite da API do GitHub nas submissões de 60 para 5000 por hora ([submissao.md](submissao.md#limite-do-github)). **Recomendado**: sem ele, o limite é dividido com outros serviços do Render e acaba rápido. |
| `CORS_ORIGINS` | qualquer origem | Origens que podem chamar a API pelo navegador, separadas por vírgula (ex.: `https://portal.exemplo.com,http://localhost:5173`). A API não usa cookies, então liberar tudo é seguro. |
| `LIMITE_SUBMISSOES` | `10` | Submissões de jogo por IP a cada 10 minutos. Acima disso, `429 MUITAS_REQUISICOES`. |

## Deploys seguintes

Todo merge no `main` gera um deploy novo. As migrações rodam na inicialização, antes do servidor subir. Se uma migração falhar, o serviço não sobe, e o Render mantém a versão anterior no ar porque o health check não passa.

Para forçar um deploy sem commit novo: **Manual Deploy → Deploy latest commit**.

## Plano free: o serviço dorme

Sem acesso por 15 minutos, o Render desliga o serviço. A primeira requisição depois disso leva de 30 a 60 s, e o fliperama ou o Portal podem dar timeout nesse meio-tempo.

O workflow [`manter-acordada.yml`](../.github/workflows/manter-acordada.yml) chama o `/health` a cada 5 minutos para evitar isso. Ele só roda a partir da branch padrão do repositório (`develop`), e o GitHub pode atrasar execuções agendadas em horários de pico. Dá para rodar manualmente em **Actions → Mantém a API acordada → Run workflow**.

Um serviço acordado o mês inteiro usa cerca de 730 das 750 horas mensais do plano free do Render (contadas por workspace). Se houver outros serviços free no mesmo workspace, o limite pode estourar; nesse caso, desative o workflow ou mude o serviço para o plano **Starter**, que não dorme.

## Logs e problemas comuns

Os logs ficam em **Logs** no serviço.

| Sintoma | Causa provável |
| --- | --- |
| `Variáveis de ambiente inválidas: - DATABASE_URL` | Variável vazia ou sem o prefixo `postgres://`/`postgresql://` |
| `/health` responde 503 `BANCO_INDISPONIVEL` | Senha errada, caracteres especiais sem codificar, ou uso da conexão direta em vez do Session pooler |
| Build falha com `tsc: not found` | O build command perdeu o `--include=dev` |
| Submissões dão `503 GITHUB_INDISPONIVEL` (limite atingido) | Falta `GITHUB_TOKEN` |
| O Portal recebe erro de CORS no navegador | `CORS_ORIGINS` definido sem a origem do Portal |
