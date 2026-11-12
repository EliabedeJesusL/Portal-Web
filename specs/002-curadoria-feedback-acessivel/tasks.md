# Tasks — Feedback acessível na Curadoria

**Fonte:** [spec.md](spec.md) e [plan.md](plan.md). Marcar somente após validar.

- [ ] **T01 [CA-01]** Identificar a função atual de login do curador e o local da mensagem de erro; conferir contra a branch de trabalho.
- [ ] **T02 [CA-01]** Envolver a mensagem de erro local em `<div role="alert">` sem modificar `ErrorBox` global.
- [ ] **T03 [CA-02/03]** Acrescentar `aria-busy={loading}` ao `<form>` de login; preservar botão e rótulo de processamento.
- [ ] **T04 [CA-01/02/03]** Verificar DOM, estados de carregamento, erro e navegação por teclado.
- [ ] **T05 [CA-04/05]** Confirmar ausência de alterações em `sessionStorage`, autenticação e chamadas à API.
- [ ] **T06 [CA-01 a CA-05]** Executar `npm run build:web` e `npm run typecheck`, registrar resultado real, conferir `git diff`.
- [ ] **T07** Registrar no MkDocs o prompt usado, artefatos, compressão Caveman, mudança no código, evidências e limitações.
