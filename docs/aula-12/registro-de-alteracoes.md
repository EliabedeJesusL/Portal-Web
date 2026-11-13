# Registro de alterações — Aula 12 (12/11/2026)

Tudo o que foi alterado no repositório para fechar a atividade, e por quê.

## Código do Portal (`web/src/`)

| Arquivo | Mudança | Motivo |
|---|---|---|
| `App.tsx` | De 1081 para 24 linhas: só `Routes` | FR-021, Princípio 6, plano etapa 3 |
| `components/ErrorBox.tsx`, `Footer.tsx`, `GameCard.tsx` | Preenchidos com o código extraído do `App.tsx`, sem mudar texto | Plano etapa 1 |
| `components/Header.tsx` | Extraído; tenta `api.health()` a cada 5 s, até 12 vezes; rótulos `API INICIANDO...` e `API OFFLINE` | FR-017 (cold start) |
| `components/Layout.tsx` (novo) | `Layout` e `Loading`; `Loading` avisa após 6 s que a API pode estar iniciando | FR-016, FR-017 |
| `components/CuratorLogin.tsx` | Extraído; `role="alert"` no erro e `aria-busy` no formulário | Feature 002 |
| `components/FormulaModal.tsx` | Bloco da fórmula da nota ajustada, mesmo texto de antes | FR-015 |
| `pages/*.tsx` (6) | Páginas extraídas, sem mudar rotas, textos nem chamadas à API | FR-021 |
| `pages/Moderacao.tsx` | Aviso de governança RF-G15 (`role="note"`) | FR-014 |
| `api.ts` | `mapHttpStatusToFriendlyMessage` no lugar de `Erro HTTP ${status}` | FR-020 |
| `styles.css` | `:focus-visible`, `.is-starting`, `.loading-hint`, `.message--warning` | FR-017, FR-018, FR-014 |

Nada mudou em `api/`, nos contratos, no `sessionStorage` nem no `sandbox` do preview.

## Spec-Kit

| Arquivo | Mudança |
|---|---|
| `specs/001-portal-web-g2/spec.md` | US4: justificativa opcional ao aprovar e obrigatória ao reprovar; tabela "Estado atual vs esperado" atualizada |
| `specs/001-portal-web-g2/tasks.md` (novo) | 26 tarefas; 1 a 18 feitas, 19 a 26 pendentes de execução |
| `specs/001-portal-web-g2/plan.md` | Seção "Estado de Execução" |
| `specs/002-curadoria-feedback-acessivel/` | Estado e local do componente atualizados; tarefas T01 a T03, T05 e T07 marcadas |

## Documentação e repositório

| Item | Mudança |
|---|---|
| `mkdocs.yml` | Movido para a raiz com `docs_dir: docs` (dentro de `docs/aula-12/` o MkDocs não o encontrava); navegação inclui as 7 páginas que faltavam |
| `docs/DEPLOY.md`, `docs/INTEGRACAO-G3.md` | Links que apontavam para fora de `docs/` agora apontam para o GitHub (davam aviso no modo strict) |
| `docs/aula-12/` | Exercícios 1 a 5, guia e implementação atualizados; removidos `LEIA-ANTES-DE-APLICAR.md` e `proposta-tasks-curadoria.md` (substituídos pelo `tasks.md` oficial) |
| `.github/workflows/docs.yml` (novo) | Roda `mkdocs build --strict` em PR e push; não publica nada |
| `.gitignore` | Ignora `site/` |
| `README.md` | Seção sobre a documentação MkDocs |
| Removidos | Pasta `Microsoft/` (cache do PowerShell commitado por engano) e `scripts/aula12_aplicar_melhoria.py` (a mudança já está aplicada; o script falharia) |

<a id="validacao-pendente"></a>
## Validação pendente

Rodar na sua máquina:

```bash
npm run install:all
npm run typecheck
npm run build:web
npm run test:api
pip install mkdocs && mkdocs build --strict
```

No navegador (`npm run dev`): abrir as 7 rotas; em `/moderacao` testar token inválido, aviso RF-G15 e `aria-busy`; usar Tab para ver o foco; derrubar a API e ver `API INICIANDO...`.

## Fora do que foi feito

- Exercício 4 (troca com outro grupo): dispensado pelo grupo, conforme pedido. O enunciado do professor lista esse exercício como obrigatório; confirmar com o professor antes de entregar.
- Decisões dos exercícios 1 a 3 e do guia: são propostas escritas pela análise, a confirmar pelo grupo.
- Commit, PR e publicação no GitHub: não feitos; dependem do grupo e da autorização do líder.
- Skill Caveman não foi instalado; os prompts são equivalentes.
