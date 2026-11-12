# Trecho original preservado — Spec-Kit G2

Fonte: `specs/001-portal-web-g2/spec.md`, User Story 4; recorte: história, rastreabilidade, prioridade e teste independente. Consulta à branch `main` em 11/11/2026. **Este arquivo é uma cópia de estudo, não uma alteração da especificação oficial.**

Como um **curador** da plataforma Recreio Arcade,
quero me autenticar fornecendo meu token de acesso `cur_...`, visualizar a fila de jogos pendentes de moderação, jogar o preview interativo de cada submissão em ambiente seguro e emitir a decisão de aprovação ou reprovação com justificativa obrigatória,
para garantir a qualidade técnica, pedagógica e de segurança dos jogos antes de disponibilizá-los aos fliperamas.

**Rastreabilidade de Requisitos**: RF-G04, RF-G09.

**Why this priority**: A curadoria é o gatekeeper de segurança e conformidade do arcade. Sem curadoria, nenhum jogo atinge o estado "aprovado" nem é distribuído para o fliperama.

**Independent Test**: Pode ser testado autenticando com um token de curador válido, selecionando um jogo pendente na lista, verificando se o iframe de preview é montado com sandbox restrito (`allow-scripts` apenas) e aprovando ou reprovando com justificativa.
