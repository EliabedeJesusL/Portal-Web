# Proposta de tarefas — Curadoria (não substitui o tasks.md oficial)

**Motivo:** `specs/001-portal-web-g2/tasks.md` não estava presente na branch `main` consultada em 11/11/2026. Esta é uma **proposta para revisão**, não um resultado oficial de `/speckit.tasks`. Os identificadores abaixo são provisórios.

## Documentação e rastreabilidade

- [ ] CUR-01 Conferir FR-006 a FR-009 e User Story 4 contra contrato da API. **Validação:** matriz de cobertura com cada critério.
- [ ] CUR-02 Esclarecer redação da justificativa obrigatória apenas para reprovação, mediante aceite do grupo. **Validação:** texto alinhado a `api/docs/curadoria.md`.
- [ ] CUR-03 Registrar limite de RF-G15 (aviso/controle humano, sem comprovação de bloqueio técnico). **Validação:** decisão documental explícita.

## Implementação existente — verificar, não presumir concluída

- [ ] CUR-04 Verificar autenticação por `GET /api/curadores/eu` e sessão apenas em `sessionStorage`. **Teste:** token válido/inválido/logout.
- [ ] CUR-05 Verificar fila por `GET /api/jogos?status=submetido`. **Teste:** fila com itens, vazia e indisponibilidade.
- [ ] CUR-06 Verificar `<iframe sandbox="allow-scripts">` sem permissões extras. **Teste:** inspeção do atributo no navegador.
- [ ] CUR-07 Verificar aprovação via `POST /api/versoes/{id}/decisao`. **Teste:** retorno e persistência da decisão.
- [ ] CUR-08 Verificar bloqueio de reprovação sem justificativa, comportamento com justificativa e 409 concorrente. **Teste:** status e atualização da fila.
- [ ] CUR-09 Verificar estados de carregamento/erro/cold start e navegação por teclado. **Teste:** cenários manuais documentados.
- [ ] CUR-10 Conferir modularização proposta pelo `plan.md` antes de marcar implementação como terminada. **Teste:** `npm run typecheck`, `npm run build:web` e teste das rotas, se executados.

## Critério de conclusão

Somente marcar tarefas concluídas após evidência verificável: código revisado, execução dos testes e registro do resultado. O grupo deverá gerar/revisar o `tasks.md` oficial através do fluxo Spec-Kit que escolher e aceitar.
