# Próximos passos — demonstração e produção

Este guia acompanha a versão atual do monorepo. O envio oficial de jogos continua sendo por URL de repositório GitHub + tag/ref; o pacote é validado pela API, incluindo `game.json`, `index.html`, `questoes.json`, fontes e limite de tamanho. Não use um bypass de desenvolvimento para representar uma submissão válida.

## 1. Rodar localmente (Windows PowerShell)

Requisitos: Node.js 24 e Docker Desktop iniciado. Na raiz do repositório:

```powershell
npm run install:all
Copy-Item api/.env.example api/.env
npm run demo:setup
npm run dev
```

URLs locais:
- Portal: `http://localhost:5173`
- API: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`

O seed local cria dados e tokens de demonstração (`dev-curador` e `dev-estacao`). Use-os somente no computador local.

## 2. Demonstrar a curadoria

1. Abra `http://localhost:5173/moderacao`.
2. Valide o token `dev-curador`.
3. Submeta um jogo compatível com o manifesto oficial pelo formulário **Enviar**. A API baixa o repositório e valida o pacote; jogos inválidos devem ser recusados.
4. Volte à Curadoria, selecione a versão pendente, confira o preview e aprove ou reprove. Reprovação exige justificativa.
5. Confirme que a versão aprovada aparece no catálogo.
6. Na sessão autenticada do curador, use **Criar estação G3** para gerar uma credencial de estação. Guarde o token: ele é mostrado uma única vez.

## 3. Publicar com Render + Supabase

1. Envie o repositório atualizado ao GitHub. O `render.yaml` deste projeto usa a branch `main`; altere a branch no Blueprint se a equipe publicar por outra branch.
2. Crie um projeto PostgreSQL no Supabase e copie a connection string apropriada conforme `api/docs/supabase.md`.
3. No Render, crie/deploye o Blueprint usando `render.yaml`.
4. Na API, configure `DATABASE_URL` com a string do Supabase e `GITHUB_TOKEN` opcional. Confirme `NODE_ENV=production` e `CORS_ORIGINS` contendo a URL pública exata do Portal. Nunca deixe `CORS_ORIGINS=*` em produção sem uma decisão consciente.
5. No Portal, configure `VITE_API_BASE_URL` com a URL pública da API terminando em `/api`. Como é variável de build do Vite, faça novo deploy depois de alterá-la.
6. Confira `https://SUA-API/health` e `/docs`, e teste o Portal em janela anônima.
7. Crie um curador real em ambiente seguro executando na pasta `api`: `npm run curador:criar -- "Nome do Curador"`. Guarde o token gerado; não use `dev-curador` em produção.
8. Entre na Curadoria publicada com o token real e crie a estação de produção. Configure o token retornado no `.env` do G3, sem comitá-lo.
9. Teste submissão, decisão, catálogo, sincronização G3, envio de placar e reenvio offline.

## 4. Configuração G3

No `fliperama-local/.env`, `API_G1` deve ser a URL pública da API sem `/api` final (o serviço concatena os caminhos), e `TOKEN_ESTACAO` deve ser o token da estação criada na Curadoria. `VITE_API_URL` e `CORS_ORIGIN` continuam apontando para o servidor/interface locais do quiosque.

## 5. Segurança e limites

- Nunca publique tokens, senhas ou `DATABASE_URL` no Git.
- Tokens de curador e estação são diferentes.
- A Curadoria usa token Bearer; não é um sistema de e-mail/senha.
- O envio oficial é GitHub + ref/tag e valida o pacote; não habilite atalhos que contornem validação em produção.
- Faça backup do banco antes de mudanças de schema.
- Plano gratuito pode suspender serviços por inatividade e tem limites de recursos; valide disponibilidade e latência antes de uma apresentação.

## 6. Testes antes da entrega

Na raiz, com Node.js 24 e Docker disponível:

```powershell
npm run test:api
npm run typecheck
npm run build:web
```

Só declare a integração concluída depois de os comandos passarem e de um teste real com G3 registrar o placar na API.
