# Plan — Feedback acessível na autenticação da Curadoria

**Spec:** [spec.md](spec.md)  
**Estado:** executado em 12/11/2026; validação (`typecheck`, `build:web`, navegador) pendente.

## Decisão técnica

Modificar exclusivamente o formulário de autenticação já existente na função `CuratorLogin`. Na `main` consultada ela estava em `web/src/App.tsx`; após o retrofit modular da feature 001 (que o risco abaixo já previa), ela está em `web/src/components/CuratorLogin.tsx`, e a mudança foi feita lá.

1. Embrulhar a exibição condicional do componente `ErrorBox` com `<div role="alert">`, preservando o conteúdo e a lógica existentes.
2. Adicionar `aria-busy={loading}` ao elemento `<form>` atual.
3. Não alterar `ErrorBox` global, sessão, requests, tokens, estilos, contratos de API ou respostas do servidor.

## Alternativas rejeitadas

- Reescrever `CuratorLogin` inteiro: escopo desnecessário.
- Adicionar biblioteca de acessibilidade: dependência desnecessária para dois atributos semânticos.
- Aplicar `role="alert"` global em `ErrorBox`: afetaria outras telas e ampliaria o escopo.

## Verificação

- Conferir diff contendo apenas a mudança esperada em `CuratorLogin.tsx` (além da extração do componente).
- `npm run build:web` e `npm run typecheck`.
- Abrir `/moderacao`, provocar validação inválida e verificar elemento `role="alert"` com texto visível.
- Durante requisição, conferir `aria-busy="true"` e botão desabilitado; ao fim, `aria-busy="false"`.
- Confirmar que login válido e saída continuam funcionando (somente em ambiente seguro com credencial apropriada).

## Dependências / riscos

Depende da estrutura original do formulário ainda existir; conflito com refatoração modular exige localização do componente real antes de aplicar. Nenhuma migração de banco necessária.
