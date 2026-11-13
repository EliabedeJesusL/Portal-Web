# Exercício 3 — Duas revisões do ciclo Spec-Kit

**Fases selecionadas:** Spec e Plan. Método: prompts equivalentes ao Caveman. Status: achados documentados; as propostas foram aplicadas em 12/11/2026 e precisam de confirmação do grupo.

## Revisão 1 — Spec contra requisitos e contrato

**Prompt:** "Revise a User Story 4 e FR-006 a FR-009 de `spec.md` contra `api/docs/curadoria.md` e a Constitution. Liste apenas ambiguidades e divergências verificáveis: trecho — impacto — proposta. Sem alterar requisitos."

| Observação | Evidência | Proposta | Decisão (a confirmar) |
|---|---|---|---|
| Ambiguidade da justificativa na história de usuário | A User Story 4 dizia "aprovação ou reprovação com justificativa obrigatória"; `api/docs/curadoria.md` exige só ao reprovar | Escrever que é opcional ao aprovar e obrigatória ao reprovar | **Proposta aplicada** em `spec.md` (US4); a confirmar |
| Resumo conciso não pode substituir os critérios de segurança | O cenário 4 exige `<iframe sandbox="allow-scripts">`, sem `allow-same-origin` nem `allow-forms` | Manter o critério integral na spec; resumir só na comunicação | Proposta: nada a alterar na spec; a confirmar |
| RF-G15 depende de governança humana | FR-014 e Edge Cases descrevem aviso orientador, não bloqueio técnico | Manter explícita a limitação; implementar o aviso na tela | **Proposta aplicada**: aviso `role="note"` em `Moderacao.tsx`; a confirmar |

**Resposta concisa:** "Esclarecer justificativa só na reprovação. Preservar sandbox restrito. RF-G15: aviso não equivale a impedimento técnico."

## Revisão 2 — Plan: decisões, contratos, dados, riscos e dúvidas

**Prompt:** "Resuma `plan.md` em Decisões, Contratos, Dados, Riscos e Dúvidas. Sinalize tarefas futuras que ainda carecem de evidência de implementação."

| Categoria | Síntese ancorada no plano |
|---|---|
| Decisões | Retrofit modular do frontend sem mudar rotas, CSS, textos e comportamento; HTTP só em `web/src/api.ts`. |
| Contratos | Rotas e payloads oficiais da API; `POST /api/versoes/{id}/decisao` e `GET /api/curadores/eu`. |
| Dados | Token só em `sessionStorage`; catálogo e decisões persistidos pela API G1. |
| Riscos | Sandbox permissivo, erros técnicos ao usuário, regressão na extração de componentes, falha de cold start. |
| Dúvidas | Como provar equivalência além do build? Como proteger RF-G15 sem autenticação de autor? |

**Verificação no código recebido (12/11/2026):** `App.tsx` ainda tinha 1081 linhas e `pages/` e `components/` estavam com 0 bytes, ou seja, o plano **não estava executado**. O `iframe` já estava correto (`allow-scripts`).

**Proposta:** aplicar o retrofit. Foi feito (ver registro); o grupo confirma. O retrofit do plano foi feito (ver [registro de alterações](registro-de-alteracoes.md)). A dúvida sobre equivalência continua aberta até rodar `typecheck`, `build:web` e a comparação no navegador (tasks T019 a T025). A dúvida sobre RF-G15 permanece: é aviso, não controle técnico.

**Resposta concisa:** "Extraído sem mudar API. Sessão e sandbox preservados. Falta validar tipagem, build e comportamento."
