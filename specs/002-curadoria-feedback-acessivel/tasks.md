# Tasks — Feedback acessível na Curadoria

**Fonte:** [spec.md](spec.md) e [plan.md](plan.md). Marcar somente após validar.

- [x] **T01 [CA-01]** Identificar a função atual de login do curador e o local da mensagem de erro. Resultado: `CuratorLogin`, agora em `web/src/components/CuratorLogin.tsx`.
- [x] **T02 [CA-01]** Envolver a mensagem de erro local em `<div role="alert">` sem modificar `ErrorBox` global.
- [x] **T03 [CA-02/03]** Acrescentar `aria-busy={loading}` ao `<form>` de login; botão e rótulo `VALIDANDO...` preservados.
- [ ] **T04 [CA-01/02/03]** Verificar DOM, estados de carregamento, erro e navegação por teclado (navegador).
- [x] **T05 [CA-04/05]** Confirmar ausência de alterações em `sessionStorage`, autenticação e chamadas à API (conferido lendo o código: `validate`, `setCuratorToken` e `api.validarCurador` não foram tocados).
- [ ] **T06 [CA-01 a CA-05]** Executar `npm run build:web` e `npm run typecheck`, registrar resultado real, conferir `git diff`.
- [x] **T07** Registrar no MkDocs o prompt usado, artefatos, compressão Caveman, mudança no código, evidências e limitações (`docs/aula-12/`).
