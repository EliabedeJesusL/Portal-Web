# Pacote de documentação da Aula 12 — como aplicar

Gerado a partir dos arquivos reais da branch `main` consultados em 11/11/2026. Este pacote **não modifica código, spec.md, plan.md, constitution.md nem configurações de produção**.

## Aplicação segura

1. No repositório local limpo, atualize a `main` e crie uma branch: `git switch main; git pull; git switch -c docs/aula12-caveman-revisao-gpt`.
2. Copie o conteúdo da pasta `docs/aula-12/` para o mesmo local do repositório.
3. Se ainda não existe `mkdocs.yml`, copie o arquivo incluído; se existir em sua branch, faça **merge manual da navegação**, não sobrescreva.
4. Instale MkDocs num ambiente virtual e execute `mkdocs build --strict` e `mkdocs serve`.
5. Preencha os campos `PENDENTE` após revisão humana e teste com outro grupo.
6. Reveja `git diff --stat` e `git diff`, faça commit e abra PR; não faça merge sem revisão.

## O que ainda precisa acontecer

- Exercício 4: troca e respostas reais de outro grupo; não simular.
- Exercício 3: decisões do grupo em ambas as revisões.
- Exercício 5: aplicar e validar efetivamente as alterações escolhidas e registrar commits/testes.
- `specs/001-portal-web-g2/tasks.md`: não existia na main consultada. A proposta neste pacote **não é substituto** do tasks oficial.
- Guia: registrar decisões humanas dos três exemplos.

## Segurança

Não inclua `.env`, `DATABASE_URL`, senhas, tokens de curadoria ou credenciais no commit.

## Nota técnica

A estrutura real da branch `main` analisada inclui `web/src/App.tsx` com código e arquivos `web/src/pages/Moderacao.tsx` e `web/src/components/CuratorLogin.tsx` vazios. Logo, a refatoração modular do plano **não foi validada como concluída**.
