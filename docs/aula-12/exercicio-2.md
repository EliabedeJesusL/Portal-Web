# Exercício 2 — Três níveis de concisão

**Mesmo trecho do exercício 1.** Comparação por quantidade de palavras separadas por espaço; não representa tokens de API. Produzido por simulação manual de Caveman, sem afirmar uso do skill instalado.

## Original

Como um **curador** da plataforma Recreio Arcade,
quero me autenticar fornecendo meu token de acesso `cur_...`, visualizar a fila de jogos pendentes de moderação, jogar o preview interativo de cada submissão em ambiente seguro e emitir a decisão de aprovação ou reprovação com justificativa obrigatória,
para garantir a qualidade técnica, pedagógica e de segurança dos jogos antes de disponibilizá-los aos fliperamas.

**Rastreabilidade de Requisitos**: RF-G04, RF-G09.

**Why this priority**: A curadoria é o gatekeeper de segurança e conformidade do arcade. Sem curadoria, nenhum jogo atinge o estado "aprovado" nem é distribuído para o fliperama.

**Independent Test**: Pode ser testado autenticando com um token de curador válido, selecionando um jogo pendente na lista, verificando se o iframe de preview é montado com sandbox restrito (`allow-scripts` apenas) e aprovando ou reprovando com justificativa.

## Lite — profissional

O curador autentica-se com token `cur_...`, consulta versões pendentes, testa o preview em ambiente isolado e aprova ou reprova a submissão; a reprovação exige justificativa. Objetivo: impedir a disponibilização de jogos sem análise técnica, pedagógica e de segurança. Requisitos: RF-G04 e RF-G09. Validar o fluxo com token válido, item pendente, preview em iframe restrito a `allow-scripts` e registro da decisão.

## Full — revisão operacional

Curadoria (RF-G04/RF-G09): autenticar por token; listar versões pendentes; testar preview isolado (`iframe sandbox="allow-scripts"`); aprovar ou reprovar. Reprovação exige justificativa. Verificar token válido, fila, sandbox e decisão persistida. Risco: disponibilizar jogo sem análise.

## Ultra — telegráfico

Curadoria: token → pendentes → preview isolado → aprovar/reprovar (justificar reprovação). Validar autenticação, sandbox e persistência. Risco: liberar jogo sem revisão.

## Medição reproduzível

| Versão | Palavras | Redução relativa ao original |
|---|---:|---:|
| Original | 131 | 0% |
| Lite | 60 | 54.2% |
| Full | 32 | 75.6% |
| Ultra | 21 | 84.0% |

## Informação preservada e perda potencial

- **Lite:** mantém actor, fluxo, restrição do iframe, justificativa na reprovação, objetivo e teste; já deixa de fora nuances pedagógicas específicas.
- **Full:** mantém passos críticos e risco, mas não especifica quais campos são exibidos, código de erro ou armazenamento do token; depende da spec completa.
- **Ultra:** preserva o fluxo macro, porém omite requisito RF-G04/RF-G09, formato do token, regra precisa de sandbox (`allow-scripts`), tratamento de token inválido e critérios de aceite. **Não é suficiente para implementar.**
- A versão escolhida para comunicação rápida pode ser **Full**, mantendo o documento original como referência normativa. **Aprovação do grupo: PENDENTE.**

## Prompt empregado

> Reescreva este mesmo trecho em Lite, Full e Ultra. Preserve problema, ação, testes e risco. Remova redundância, mas não invente regras. Em seguida, indique o que se perdeu.
