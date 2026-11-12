# Exercício 3 — Duas revisões do ciclo Spec-Kit

**Fases selecionadas:** Spec e Plan. Método: prompts equivalentes ao Caveman. Status: achados documentados; decisões do grupo ainda pendentes.

## Revisão 1 — Spec contra requisitos e contrato

**Prompt:** "Revise a User Story 4 e FR-006 a FR-009 de `spec.md` contra `api/docs/curadoria.md` e a Constitution. Liste apenas ambiguidades e divergências verificáveis: trecho — impacto — proposta. Sem alterar requisitos."

| Observação | Evidência | Proposta (não aplicada) |
|---|---|---|
| Ambiguidade da justificativa na história de usuário | Texto da User Story 4 diz "aprovação ou reprovação com justificativa obrigatória"; `api/docs/curadoria.md` exige obrigatoriedade somente ao reprovar | Escrever "aprovar ou reprovar; reprovação exige justificativa" |
| Resumo conciso não pode substituir os critérios de segurança | Cenário 4 exige `<iframe sandbox="allow-scripts">`, sem `allow-same-origin` nem `allow-forms` | Manter critério integral em `spec.md`; resumir apenas na comunicação |
| RF-G15 depende de governança humana | FR-014 e Edge Cases descrevem aviso orientador, não bloqueio técnico de decisão do autor | Manter explícita a limitação; não afirmar controle automático inexistente |

**Resposta concisa:** "Esclarecer justificativa somente para reprovação. Preservar sandbox restrito. RF-G15: aviso não equivale a impedimento técnico."

**Decisão do grupo:** PENDENTE.

## Revisão 2 — Plan: decisões, contratos, dados, riscos e dúvidas

**Prompt:** "Resuma `plan.md` em Decisões, Contratos, Dados, Riscos e Dúvidas. Sinalize tarefas futuras que ainda carecem de evidência de implementação."

| Categoria | Síntese ancorada no plano |
|---|---|
| Decisões | Retrofit modular do frontend, sem mudar rotas, CSS, textos e comportamento; HTTP concentrado em `web/src/api.ts`. |
| Contratos | Manter rotas e payloads oficiais da API; `POST /api/versoes/{id}/decisao` e `GET /api/curadores/eu`. |
| Dados | Token somente em `sessionStorage`; catálogo e decisões persistidas pela API G1. |
| Riscos | Sandbox permissivo, erros técnicos ao usuário, regressão na extração de componentes, falha de cold start. |
| Dúvidas | Como provar equivalência visual/funcional além do build? Como confirmar proteção de RF-G15 sem autenticação de autor? |

**Verificação adicional da branch `main` (11/11/2026):** `web/src/App.tsx` ainda concentra componentes, e `web/src/pages/Moderacao.tsx` e `web/src/components/CuratorLogin.tsx` foram consultados e estavam vazios. Portanto, **não registrar o retrofit modular como concluído**. O `plan.md` descreve trabalho futuro, não prova de execução.

**Resposta concisa:** "Extrair componentes sem alterar API. Preservar sessão e sandbox. Validar tipagem/build e comportamento. Modularização ainda não comprovada na main."

**Decisão do grupo:** PENDENTE.

## Próxima validação

Confrontar código e requisitos, registrar comandos executados e resultados antes de aprovar mudanças técnicas.
