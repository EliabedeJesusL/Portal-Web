# Deploy do Portal G2

## Produção — API oficial do G1

O Portal deve ser compilado com:

```env
VITE_API_BASE_URL=https://plataforma-gestao-api.onrender.com/api
```

A variável é incorporada ao build do Vite. Não coloque token de curador nessa variável nem no código.

## Desenvolvimento local — Mock

Para trabalhar sem depender da API oficial:

```bash
npm install
npm install --prefix web
npm install --prefix mock-api
npm run dev
```

Use o `.env` sem `VITE_API_BASE_URL` para que o Vite utilize o proxy `/api` apontando para `http://localhost:3000`.

No mock local, o token de curador para testes é:

```text
dev-curador
```

Esse token é artificial e existe somente para desenvolvimento local.

## Render

O `render.yaml` define `VITE_API_BASE_URL` com a API oficial do G1 no build de produção.
O Fastify do mock continua sendo usado apenas como servidor do frontend; o Portal não usa os dados do mock quando essa variável está configurada.

## Validação

Antes de considerar o deploy pronto:

```bash
npm run build
```

Depois valide contra a API do G1 os fluxos que exigem integração real, principalmente submissão, autenticação de curador, curadoria, rankings e anonimização.
