# Aplicação SDD + Caveman — Feedback acessível da Curadoria

> **Estado:** código alterado em 12/11/2026. `typecheck`, `build:web` e testes em navegador ainda **não foram executados**.

## Funcionalidade escolhida

Anúncio acessível do erro de autenticação e indicação de processamento no formulário do curador (`CuratorLogin`).

## Artefatos Spec-Kit

- [`spec.md`](https://github.com/EliabedeJesusL/Portal-Web/blob/develop/specs/002-curadoria-feedback-acessivel/spec.md)
- [`plan.md`](https://github.com/EliabedeJesusL/Portal-Web/blob/develop/specs/002-curadoria-feedback-acessivel/plan.md)
- [`tasks.md`](https://github.com/EliabedeJesusL/Portal-Web/blob/develop/specs/002-curadoria-feedback-acessivel/tasks.md)

Foram escritos a partir da leitura do código real, não gerados por `/speckit.*`; por isso o comando executado não é registrado aqui.

## Revisão Caveman (equivalente a Full)

**Prompt:** "Compare spec, plan e tasks. Preserve critérios, segurança e testes. Responda: divergência — impacto — correção. Máximo 8 linhas. Não altere código."

- **Divergência:** erro visível sem região de alerta no login. **Correção:** `role="alert"` só nessa mensagem.
- **Divergência:** botão desabilitado, mas o formulário não diz que está ocupado. **Correção:** `aria-busy={loading}` só no `<form>`.
- **Risco:** mexer em `ErrorBox` anunciaria erros em outras telas. **Decisão:** `ErrorBox` não foi alterado.
- **Divergência de local:** o plano apontava `App.tsx`; após o retrofit o componente está em `components/CuratorLogin.tsx`. **Correção:** plano atualizado.

## Mudança no código (`web/src/components/CuratorLogin.tsx`)

```tsx
// Antes
{error && <ErrorBox message={error} />}
<form className="form-grid" onSubmit={validate}>

// Depois
{error && (
  <div role="alert">
    <ErrorBox message={error} />
  </div>
)}
<form className="form-grid" onSubmit={validate} aria-busy={loading}>
```

## Evidências

| Evidência | Resultado real |
|---|---|
| Branch usada | Ainda não commitado; usar `develop` |
| Comando Spec-Kit executado | Nenhum (artefatos escritos à mão a partir do código) |
| Revisão Caveman | Prompt acima, equivalente a Full |
| Arquivos alterados | `web/src/components/CuratorLogin.tsx` (e os demais do retrofit, ver [registro](registro-de-alteracoes.md)) |
| Sessão e API intactas (T05) | Conferido lendo o código: `validate`, `setCuratorToken` e `api.validarCurador` iguais ao original |
| `mkdocs build --strict` | Executado, sem avisos |
| Build web | **Não executado** |
| Typecheck | **Não executado** |
| DOM com token inválido | **Não executado** |
| Teclado | **Não executado** |
| Leitor de tela | **Não executado** |
| Commit / PR | Pendente |

## Antes e depois

**Antes:** mensagem de erro sem região de alerta; carregamento só visual.
**Depois:** erro dentro de `role="alert"`; `aria-busy` verdadeiro durante a validação; botão e rótulo `VALIDANDO...` como antes.
**Caveman:** manteve a revisão em divergência, impacto e correção, e evitou tocar no `ErrorBox` global.

## Limites

A compressão ajuda a achar mudanças pequenas, mas não pode omitir regras de segurança nem condições de erro. ARIA não substitui teste com leitor de tela.
