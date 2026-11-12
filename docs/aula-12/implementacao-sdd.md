# Aplicação SDD + Caveman — Feedback acessível da Curadoria

> **Estado:** preparado para execução/validação. Não marque como concluído até aplicar código, rodar testes e conferir o diff.

## Funcionalidade escolhida

Anúncio acessível do erro de autenticação e indicação de processamento no formulário do curador. Referência: `web/src/App.tsx` da `main` consultada em 12/11/2026.

## Artefatos gerados para revisão

- [`spec.md`](../../specs/002-curadoria-feedback-acessivel/spec.md)
- [`plan.md`](../../specs/002-curadoria-feedback-acessivel/plan.md)
- [`tasks.md`](../../specs/002-curadoria-feedback-acessivel/tasks.md)

> Observação: esses arquivos foram preparados a partir de leitura dos arquivos reais. Após rodar o Codex/Spec-Kit, registre o comando executado e atualize os artefatos somente se necessário.

## Revisão Caveman (equivalente a Full)

**Prompt usado para revisão curta**: "Compare spec, plan e tasks. Preserve critérios, segurança e testes. Responda: divergência — impacto — correção. Máximo 8 linhas. Não altere código." 

**Síntese esperada para conferência humana**: 

- **Problema:** erro visível, sem região de anúncio explicitamente identificada no login.
- **Ação:** `role="alert"` somente na mensagem do login.
- **Ação:** `aria-busy={loading}` somente no formulário.
- **Risco:** anunciar mensagens indevidamente em outras telas se `ErrorBox` for modificado globalmente.
- **Teste:** DOM, teclado, loading e build; teste com leitor de tela quando possível.

Este texto é proposta de síntese, não medição de tokens nem resultado de agente executado.

## Mudança mínima no código

```tsx
// Antes
{error && <ErrorBox message={error} />}
<form className="form-grid" onSubmit={validate}>

// Depois
{error && <div role="alert"><ErrorBox message={error} /></div>}
<form className="form-grid" onSubmit={validate} aria-busy={loading}>
```

## Execução — preencher após realizar

| Evidência | Resultado real |
|---|---|
| Branch usada | PENDENTE |
| Comando Spec-Kit/Codex executado | PENDENTE |
| Revisão Caveman/prompt aplicado | PENDENTE |
| Arquivo e diff alterados | PENDENTE |
| Build web | NÃO EXECUTADO |
| Typecheck | NÃO EXECUTADO |
| Teste de token inválido / DOM | NÃO EXECUTADO |
| Teste por teclado | NÃO EXECUTADO |
| Leitor de tela (se disponível) | NÃO EXECUTADO |
| Commit / PR | PENDENTE |

## Antes e depois: contribuição ao projeto

**Antes:** mensagem de erro do login renderizada sem uma região de alerta dedicada; carregamento indicado visualmente.  
**Depois esperado:** região de alerta acessível e atributo semântico de processamento, mantendo comportamento e autenticação.  
**Caveman:** orientou a concentrar revisão em problema, mudança, risco e teste, sem reescrever o restante do sistema.

## Lições e limites

A compressão é útil para localizar mudanças pequenas. Não pode omitir regras de segurança, condições de erro ou validação. Uma marcação ARIA não substitui teste real com leitor de tela nem comprova por si só a acessibilidade integral da tela.
