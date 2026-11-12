# Exercício 5 — Aplicação ao fluxo da feature

**Feature:** Curadoria de Jogos (G2). **Status:** relatório preliminar produzido; alterações no Spec-Kit oficial e no código **não aplicadas**.

## Relatório conciso

**Spec:** User Story 4, FR-006 a FR-009 e RF-G15; esclarecer a redação da justificativa apenas na reprovação, preservando sandbox e autenticação.

**Plano:** retrofit modular previsto, HTTP em `api.ts`, sessão em `sessionStorage` e preview restrito.

**Tasks:** arquivo oficial ausente na `main` consultada; [proposta provisória](proposta-tasks-curadoria.md) para análise e geração posterior no Spec-Kit.

**Implementação:** validar código da Curadoria e testes antes de declarar conformidade. A `main` ainda contém código em `App.tsx` e arquivos de páginas/componentes vazios.

**Riscos:** liberação indevida de versões; preview permissivo; token indevidamente persistido; falsa declaração de atendimento de RF-G15; marcação antecipada de tarefas.

**Próximo passo:** grupo confirmar critérios, gerar `tasks.md` oficial, comparar código com critérios, testar e registrar evidências.

## Melhorias identificadas e estado

| Alteração | Tipo | Estado | Evidência de conclusão exigida |
|---|---|---|---|
| Redação da justificativa no resumo da história | Spec | PROPOSTA | Diff aprovado do `spec.md` |
| Resumo de decisões, contratos e riscos | Plan | DOCUMENTADO NESTE EXERCÍCIO | Revisão humana |
| Criar tarefas rastreáveis da Curadoria | Tasks | PROPOSTA | `tasks.md` oficial revisado |
| Conferir sandbox, token e decisões contra a spec | Implementação | NÃO TESTADO | Resultado de testes e revisão de código |

## Onde Caveman ajuda e atrapalha

**Ajuda:** reduz repetição e organiza diferenças em formato acionável. **Atrapalha se aplicado sem cuidado:** o modo Ultra pode ocultar a obrigatoriedade seletiva da justificativa, restrições exatas do sandbox e a distinção entre aviso de governança e controle de autorização.

**Decisão final do grupo e commits aplicados:** PENDENTE. Não registrar melhoria como incorporada ao produto antes do merge/teste.
