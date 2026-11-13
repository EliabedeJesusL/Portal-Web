# Tasks: Retrofit Modular do Portal Web G2

**Input**: `specs/001-portal-web-g2/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`)
**Escopo**: só `web/` (G2). Nenhuma mudança na API G1 nem nos contratos.
**Regra da Constituição (Princípio 4)**: tarefa de verificação só é marcada `[x]` depois de rodar o comando e ver o resultado.

Legenda: `[x]` feito e conferido no código/diff · `[ ]` pendente (precisa rodar em máquina com Node + navegador).

## Phase 1 — Componentes base (`web/src/components/`)

- [x] T001 Extrair `ErrorBox` para `components/ErrorBox.tsx` (FR-021)
- [x] T002 Extrair `Layout` e `Loading` para `components/Layout.tsx`; `Loading` ganha aviso de cold start após 6 s (FR-016, FR-017)
- [x] T003 [P] Extrair `Footer` para `components/Footer.tsx`
- [x] T004 Extrair `Header` para `components/Header.tsx` com retentativa de `api.health()` a cada 5 s, até 12 vezes, e estado `API INICIANDO...` (FR-017)
- [x] T005 [P] Extrair `GameCard` para `components/GameCard.tsx`
- [x] T006 Extrair `CuratorLogin` para `components/CuratorLogin.tsx` (inclui `role="alert"` no erro e `aria-busy` no formulário — feature `002-curadoria-feedback-acessivel`)
- [x] T007 [P] Criar `components/FormulaModal.tsx` com a explicação da nota ajustada (FR-015)

## Phase 2 — Páginas (`web/src/pages/`)

- [x] T008 [P] [US1] `pages/Catalogo.tsx` (FR-001, FR-016)
- [x] T009 [P] [US1] `pages/Detalhes.tsx` (FR-002)
- [x] T010 [P] [US3] `pages/Enviar.tsx` (FR-003, FR-004, FR-013)
- [x] T011 [US4] `pages/Moderacao.tsx`: fila, preview com `sandbox="allow-scripts"`, decisão, estações; aviso RF-G15 (FR-005 a FR-009, FR-014)
- [x] T012 [P] [US5] `pages/RankingJogadores.tsx` (FR-010, FR-011, FR-012)
- [x] T013 [P] [US2] `pages/RankingJogos.tsx`, usando `FormulaModal` (FR-015)

## Phase 3 — Roteador

- [x] T014 Reduzir `App.tsx` às rotas (`*`, `/catalogo`, `/jogos/:id`, `/enviar`, `/moderacao`, `/ranking/jogadores`, `/ranking/jogos`), sem criar, renomear nem remover rota

## Phase 4 — Conformidade

- [x] T015 `api.ts`: trocar o fallback `Erro HTTP ${status}` por `mapHttpStatusToFriendlyMessage(status)`; manter `erro` da API quando existir (FR-020)
- [x] T016 `styles.css`: `:focus-visible` em links, botões, `.queue-item`, `.game-card`, menu (FR-018); estilo `is-starting` e `message--warning`
- [x] T017 Conferir que o `iframe` do preview usa só `sandbox="allow-scripts"` (FR-008) — conferido em `pages/Moderacao.tsx`
- [x] T018 Conferir que o token continua só em `sessionStorage` (FR-006) — `api.ts` não foi alterado nessa parte

## Phase 5 — Validação (pendente de execução)

- [ ] T019 Rodar `npm run install:all` e `npm run typecheck` (API + Portal) sem erro
- [ ] T020 Rodar `npm run build:web` sem erro
- [ ] T021 Rodar `npm run test:api` (151 testes; não deve mudar, a API não foi tocada)
- [ ] T022 Navegador: abrir as 7 rotas e comparar textos e comportamento com a versão anterior
- [ ] T023 Navegador: `/moderacao` — token inválido mostra o erro; durante a validação `aria-busy="true"`; aviso RF-G15 visível
- [ ] T024 Navegador: navegar por Tab e ver o foco amarelo em links, botões, cards e itens de fila
- [ ] T025 Navegador: derrubar a API e conferir `API INICIANDO...` e, depois de ~60 s, `API OFFLINE`
- [ ] T026 Abrir PR de `develop` e aguardar autorização do líder para a `main`

## Dependências

T001 → T002 → T004 → T011 · T001 → T006 → T011 · T007 → T013 · T001–T013 → T014 · T014–T018 → T019–T025 → T026
