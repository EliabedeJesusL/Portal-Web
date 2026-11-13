# Exercício 4 — Teste de perda de informação

**Status: dispensado pelo grupo nesta entrega.** A troca com outro grupo não será feita. Não há respostas de outro grupo e nenhuma foi simulada.

## O que fica registrado

O protocolo abaixo continua aqui caso o grupo queira fazer a troca depois.

1. Enviar ao outro grupo **só** o texto Ultra e as cinco perguntas, sem o repositório nem o original.
2. Pedir resposta escrita sem consulta.
3. Guardar as respostas integrais, com grupo e data.
4. Comparar com o [trecho original](trecho-original-curadoria.md).

**Texto Ultra:** "Curadoria: token → pendentes → preview isolado → aprovar/reprovar (justificar reprovação). Validar autenticação, sandbox e persistência. Risco: liberar jogo sem revisão."

**Perguntas:** qual problema? qual ação? quais testes? qual risco? que informação faltou?

## Perda de informação já conhecida (análise do próprio grupo, sem troca)

| Informação preservada no Ultra | Informação perdida no Ultra |
|---|---|
| Fluxo macro: token, fila, preview, decisão | Rastreabilidade RF-G04 e RF-G09 |
| Justificativa só na reprovação | Formato `cur_...` do token |
| Risco de liberar jogo sem revisão | Regra exata `allow-scripts` sem `allow-same-origin` nem `allow-forms` |
| Validar autenticação, sandbox e persistência | Tratamento de token inválido e critérios Given/When/Then |

Isto vem da comparação feita no [Exercício 2](exercicio-2.md), não de um teste com outro grupo, e por isso não prova que o Ultra funciona para quem não viu o original.
