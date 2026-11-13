# Exercício 5 — Aplicação ao fluxo da feature

**Feature:** Curadoria de Jogos (G2) e feedback acessível do login do curador. **Status:** melhorias aplicadas no código e nos artefatos Spec-Kit em 12/11/2026; validação em máquina com Node e navegador pendente.

## Relatório conciso

**Spec:** US4 esclarecida (justificativa só ao reprovar); tabela "Estado atual vs esperado" atualizada.

**Plano:** retrofit modular executado; HTTP continua só em `api.ts`; sessão em `sessionStorage`; preview com `allow-scripts`.

**Tasks:** `specs/001-portal-web-g2/tasks.md` criado (26 tarefas; 1 a 18 feitas, 19 a 26 aguardam execução). `specs/002-.../tasks.md` com T01 a T03, T05 e T07 feitas.

**Implementação:** `App.tsx` de 1081 para 24 linhas; 6 páginas e 7 componentes; aviso RF-G15; cold start; erros sem "Erro HTTP"; foco visível; `role="alert"` e `aria-busy` no login do curador.

**Riscos:** regressão na extração (sem teste automatizado no frontend); `role="alert"` não substitui teste com leitor de tela; RF-G15 é só aviso.

**Próximo passo:** rodar `npm run typecheck` e `npm run build:web`, conferir no navegador (tasks T19 a T25), abrir PR na `develop`.

## Melhorias identificadas e estado

| Alteração | Tipo | Estado | Evidência |
|---|---|---|---|
| Justificativa só na reprovação, na US4 | Spec | **Feito** | `specs/001-portal-web-g2/spec.md` |
| Tabela "Estado atual vs esperado" refletindo o código | Spec | **Feito** | mesma spec, seção final |
| Resumo de decisões, contratos e riscos | Plan | **Feito** | [Exercício 3](exercicio-3.md); "Estado de Execução" no `plan.md` |
| `tasks.md` oficial da feature 001 | Tasks | **Feito** | `specs/001-portal-web-g2/tasks.md` |
| Modularização de `App.tsx` | Implementação | **Feito, sem build** | `web/src/pages/`, `web/src/components/` |
| Aviso RF-G15 na curadoria | Implementação | **Feito, sem teste visual** | `web/src/pages/Moderacao.tsx` |
| Cold start (retentativa e aviso) | Implementação | **Feito, sem teste visual** | `Header.tsx`, `Layout.tsx` |
| Erros sem `Erro HTTP <status>` | Implementação | **Feito, sem build** | `web/src/api.ts` |
| `:focus-visible` | Implementação | **Feito, sem teste visual** | `web/src/styles.css` |
| `role="alert"` e `aria-busy` no login | Implementação | **Feito, sem teste visual** | `web/src/components/CuratorLogin.tsx` |

## Como o Caveman contribuiu

O pedido curto "divergência — impacto — correção" fez a revisão cair em fatos verificáveis: foi assim que apareceu que o plano estava só no papel (arquivos vazios) e que a US4 contradizia a API. Sem isso, o plano seria marcado como feito.

## Onde atrapalha

O Ultra esconde a obrigatoriedade seletiva da justificativa, o sandbox exato e a diferença entre aviso de governança e controle de acesso. Por isso a spec continua completa e o resumo curto só serve para comunicar.

**Commits e PR:** ainda não feitos. O grupo precisa commitar na `develop` e pedir a autorização do líder para subir à `main`.
