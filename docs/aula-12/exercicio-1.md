# Exercício 1 — Diagnóstico de verbosidade

**Fonte real:** `specs/001-portal-web-g2/spec.md`, User Story 4, recorte preservado em [trecho original](trecho-original-curadoria.md). **Status:** revisão feita com prompt equivalente ao Caveman. As decisões abaixo são **propostas**; o grupo precisa confirmar ou alterar antes da entrega.

## Prompt empregado (simulação manual)

> Classifique trechos como PRESERVAR, RESUMIR, CORTAR ou ESCLARECER. Justifique tecnicamente. Preserve atores, autorização, critérios, segurança, testes e riscos. Não invente requisitos.

## Marcações sobre o original

| # | Trecho literal do artefato | Decisão proposta | Motivo |
|---|---|---|---|
| 1 | "me autenticar fornecendo meu token de acesso `cur_...`" | **PRESERVAR** | Define a forma de autenticação do curador. |
| 2 | "visualizar a fila de jogos pendentes de moderação" | **PRESERVAR** | Define operação e estado dos itens. |
| 3 | "jogar o preview interativo de cada submissão em ambiente seguro" | **PRESERVAR e ESCLARECER** | Impõe teste jogável; isolamento precisa continuar explícito. |
| 4 | "emitir a decisão de aprovação ou reprovação com justificativa obrigatória" | **ESCLARECER** | O texto isolado sugere justificativa em ambos os casos; a API exige justificativa obrigatória apenas na reprovação (`api/docs/curadoria.md`). |
| 5 | "para garantir a qualidade técnica, pedagógica e de segurança dos jogos antes de disponibilizá-los aos fliperamas" | **RESUMIR** | Objetivo relevante, mas pode ser formulado em menos palavras sem perda. |
| 6 | "A curadoria é o gatekeeper de segurança e conformidade do arcade." | **CORTAR metáfora; PRESERVAR regra** | Termo metafórico não adiciona teste; preservar que só versões aprovadas chegam ao catálogo/fliperama. |
| 7 | "Sem curadoria, nenhum jogo atinge o estado "aprovado" nem é distribuído para o fliperama." | **PRESERVAR** | Define gate de publicação. |
| 8 | "verificando se o iframe de preview é montado com sandbox restrito (`allow-scripts` apenas)" | **PRESERVAR** | Restrição de segurança verificável. |

## Conclusão preliminar

O trecho é predominantemente funcional; o principal ganho vem da remoção da metáfora e de repetições de finalidade. **A obrigação da justificativa precisa ser explicitada somente para reprovação**, conforme o contrato da API. A compressão não pode descartar token, fila pendente, isolamento, decisão e validação.

## Decisões propostas (a confirmar pelo grupo)

| # | Decisão | Aplicada em |
|---|---|---|
| 4 | **Proposta aplicada na spec.** Esclarecer que a justificativa é obrigatória só ao reprovar | `specs/001-portal-web-g2/spec.md`, User Story 4 |
| 5 | **Proposta.** Sugestão de resumo; texto original mantido na spec (normativa) | — |
| 6 | **Proposta.** A metáfora fica só no texto de contexto; a regra (só versão aprovada chega ao fliperama) já está em FR-001 e FR-009 | — |
| 1, 2, 3, 7, 8 | **Preservados** | — |

Marcações de corte ou preservação: 8 (mínimo pedido na aula: 5).
