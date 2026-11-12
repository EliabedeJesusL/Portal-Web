# Exercício 1 — Diagnóstico de verbosidade

**Fonte real:** `specs/001-portal-web-g2/spec.md`, User Story 4, recorte preservado em [trecho original](trecho-original-curadoria.md). **Status:** revisão produzida com prompt equivalente ao Caveman; ainda depende de avaliação do grupo.

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

**Decisão do grupo:** PENDENTE (registrar aceite/rejeição e responsável antes da entrega).
