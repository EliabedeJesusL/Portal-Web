# Spec — Feedback acessível na autenticação da Curadoria

**Feature:** `002-curadoria-feedback-acessivel`  
**Origem:** revisão da implementação real do `CuratorLogin` (na época em `web/src/App.tsx`), branch `main`, consultada em 12/11/2026.  
**Estado:** implementada em 12/11/2026 em `web/src/components/CuratorLogin.tsx`; validação em navegador/leitor de tela pendente. Preparada com prompts equivalentes ao Caveman, sem execução automatizada da skill.

## Problema

O formulário de autenticação informa erros visualmente, mas a região de mensagem não é identificada explicitamente como alerta para tecnologias assistivas. Durante a validação, o botão apresenta `VALIDANDO...` e fica desabilitado, mas o formulário não comunica formalmente o estado de ocupado.

## História de usuário

Como curador que utiliza leitor de tela, quero receber anúncio do erro ao validar um token e saber que o formulário está processando a solicitação, para compreender o resultado sem depender apenas da observação visual.

## Critérios de aceitação

- **CA-01:** Dado um token inválido e uma falha de validação, quando a mensagem de erro aparece, ela está dentro de uma região com `role="alert"`, contendo o mesmo texto amigável já fornecido pela aplicação.
- **CA-02:** Enquanto a chamada de validação está em andamento, o formulário apresenta `aria-busy="true"`; ao encerrar, retorna a `false`.
- **CA-03:** O botão mantém o estado desabilitado e o rótulo `VALIDANDO...` durante a validação, sem alterar o fluxo de autenticação.
- **CA-04:** A credencial continua armazenada somente em `sessionStorage` após validação bem-sucedida; a alteração não acrescenta armazenamento nem altera requisições.
- **CA-05:** O formulário continua utilizável por teclado; mensagens visuais e fluxo atual permanecem iguais.

## Fora de escopo

Alterar API G1, validar autor versus curador, mudar tokens, moderação, estações, preview, endpoints, estilos gerais ou dependências.

## Risco e validação

Risco baixo: atributo semântico com possível diferença entre tecnologias assistivas. Validar marcação no DOM, comportamento com teclado e, se disponível, um leitor de tela. Um teste visual por si só **não comprova** anúncio em leitor de tela.
