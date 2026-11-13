# Guia Spec-Kit + Caveman do Grupo

**Projeto:** Recreio Arcade — G2, Curadoria. **Ferramenta utilizada nesta preparação:** prompts equivalentes ao Caveman. Não houve instalação comprovada do skill. O Spec-Kit do projeto está configurado para Gemini; a revisão auxiliar foi feita em ChatGPT e as alterações foram aplicadas ao código por Claude.

## Quando usar

| Artefato ou etapa | Nível preferido | Saída de revisão |
|---|---|---|
| `spec.md` | Lite/Full | requisito — ambiguidade — impacto — correção proposta |
| `plan.md` | Lite | decisões — contratos — dados — riscos — dúvidas |
| `tasks.md` | Full | tarefa — dependência — teste — problema |
| Código/implementação | Full | arquivo:linha — divergência — teste necessário |
| Recado rápido ao grupo | Ultra | status — próxima ação — bloqueio |

## Quando solicitar explicação detalhada

Segurança de preview, autenticação, perda de dados, decisões arquiteturais, critérios ambíguos e riscos sem teste. O modo Ultra **não deve substituir** `spec.md`, `plan.md` ou contratos da API.

## Regras de segurança documental

1. Não transformar hipótese em conclusão.
2. Preservar critérios Given/When/Then originais e referências RF-G04/RF-G09/RF-G15.
3. Nunca declarar teste executado ou decisão aprovada sem evidência.
4. Separar revisão de comunicação (pode encurtar) de especificação normativa (precisa ser completa).
5. Registrar agente, prompt, artefato, versão, decisão humana e commit.

## Formatos padronizados

**Spec versus código:** `arquivo:linha — requisito — divergência — correção proposta — teste`.

**Tasks:** `ID — requisito — dependência — pendência — validação`.

## Três exemplos reais da feature

### Exemplo 1 — História de curadoria

**Original (trecho literal):** "quero me autenticar fornecendo meu token de acesso `cur_...`, visualizar a fila de jogos pendentes de moderação".

**Caveman (Full):** "Token de curador → fila de versões pendentes."

**Avaliação da revisão:** mantém a ação central, mas omite validação do token e estados de erro. **Decisão proposta:** ajustar. Usar a versão Full só em recados; na spec, manter o texto completo e acrescentar "a justificativa é obrigatória só ao reprovar" (aplicado em `spec.md`, US4).

### Exemplo 2 — Regra de preview

**Original (trecho literal da User Story 4):** "o sistema renderiza o preview jogável dentro de um elemento `<iframe>` com atributo `sandbox="allow-scripts"` (estritamente sem `allow-same-origin` e sem `allow-forms`)".

**Caveman (Full):** "Preview em iframe sandbox `allow-scripts`; proibir `allow-same-origin`/`allow-forms`."

**Avaliação da revisão:** preserva a restrição de segurança, adequada a checklist de revisão. **Decisão proposta:** aceitar. Conferido no código: `Moderacao.tsx` usa `sandbox="allow-scripts"`.

### Exemplo 3 — Plano de modularização

**Original (trecho literal do plano):** "extrair as funções de componentes e páginas para seus respectivos arquivos existentes, corrigir os pontos de conformidade e preservar 100% dos comportamentos funcionais, rotas e textos exibidos".

**Caveman (Full):** "Extrair páginas/componentes sem mudar rotas, textos e comportamento; corrigir não conformidades."

**Avaliação da revisão:** boa síntese operacional, mas escondia que o plano não estava executado. **Decisão proposta:** aceitar e aplicar. O retrofit foi feito (`App.tsx` de 1081 para 24 linhas); a equivalência ainda precisa de `typecheck`, `build:web` e comparação no navegador.

## Registro de decisões finais (a confirmar pelo grupo)

| Exemplo | Decisão | Responsável/data | Evidência |
|---|---|---|---|
| 1 | Ajustar | a preencher | `spec.md`, US4 |
| 2 | Proposta: aceitar | a preencher | `web/src/pages/Moderacao.tsx` |
| 3 | Proposta: aceitar e aplicar | a preencher | `web/src/pages/`, `web/src/components/`, `tasks.md` (T001 a T018) |

*Nomes dos responsáveis e data de aceite: preencher pelo grupo antes da entrega.*

## Conclusão

Comunicação concisa facilita revisão, mas precisa de fontes rastreáveis. O recorte usado nos exercícios está em [Exercício 2](exercicio-2.md). A troca com outro grupo ([Exercício 4](exercicio-4.md)) foi dispensada, então o limite do Ultra vem só da nossa comparação com o original.
