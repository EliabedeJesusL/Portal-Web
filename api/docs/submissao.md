# Submissão de jogos

O autor submete um jogo informando o **link do repositório no GitHub** e uma **tag**. A API baixa o código dessa tag, valida e guarda o pacote. A versão fica `submetido` até um curador decidir.

## Preparar o repositório (autores / G4)

O repositório precisa ser **público**, com estes arquivos **na raiz**:

```
index.html       ← o jogo abre por aqui
game.json        ← manifesto
questoes.json    ← banco de questões (o nome vem do campo "questoes" do manifesto)
capa.png         ← capa (o nome vem do campo "capa")
...              ← js, css, imagens, sons
```

`game.json`:

```json
{
  "id": "quiz-invaders",
  "nome": "Quiz Invaders",
  "versao": "1.0.0",
  "autores": ["Fulana", "Beltrano"],
  "descricao": "Derrube as naves certas respondendo às questões.",
  "controles": "Setas movem, espaço atira.",
  "entrada": "index.html",
  "capa": "capa.png",
  "classico_referencia": "Space Invaders",
  "mecanica": "tiro",
  "tema": "Matemática",
  "nivel": "ensino médio",
  "questoes": "questoes.json"
}
```

- `id`: letras minúsculas, números e hífens. Identifica o jogo para sempre; versões novas usam o mesmo `id`.
- `versao`: semver (`1.0.0`). Cada submissão precisa de um número novo, exceto quando a anterior foi reprovada.
- `mecanica`: `plataforma`, `labirinto`, `tiro`, `encaixe` ou `corrida`.

`questoes.json` precisa de **pelo menos 20 questões**, e toda questão precisa de `fonte`:

```json
{
  "tema": "Matemática",
  "nivel": "ensino médio",
  "questoes": [
    {
      "id": "q1",
      "enunciado": "Quanto é 7 × 8?",
      "alternativas": ["56", "54", "64", "48"],
      "correta": 0,
      "explicacao": "7 × 8 = 56.",
      "fonte": "https://pt.wikipedia.org/wiki/Tabuada"
    }
  ]
}
```

`correta` é o índice da alternativa certa, começando em 0.

Depois de commitar, crie a tag e envie:

```bash
git tag v1.0.0
git push origin v1.0.0
```

O pacote todo (o zip do repositório) pode ter no máximo **20 MB**.

### Fim da partida: apelido e placar

No fim de cada partida, o jogo pede o **apelido** do jogador (A-Z e 0-9, até 9 caracteres) e envia a mensagem `PLACAR` ao fliperama, com o apelido em `jogador`. Detalhes e exemplo em [placares.md](placares.md#1-o-jogo-envia-placar-g4).

## Submeter (Portal / G2)

```http
POST /api/jogos
Content-Type: application/json

{
  "repositorio_url": "https://github.com/Arcade-IFES/quiz-invaders",
  "ref": "v1.0.0",
  "resumo": "Space Invaders com questões de matemática."
}
```

- `repositorio_url` e `ref` são obrigatórios; `resumo` (até 300 caracteres) é opcional e só vale na primeira submissão do jogo.
- Não precisa de token.
- Nome, descrição, autores e demais dados **vêm do `game.json`**; o formulário não precisa pedir.

**Resposta `201`**: o jogo no mesmo formato de `GET /api/jogos/{id}`, com `status: "submetido"` e a versão nova em `versoes`.

```json
{
  "id": "quiz-invaders",
  "nome": "Quiz Invaders",
  "versao": "1.0.0",
  "status": "submetido",
  "versao_id": "5c1d…",
  "tamanho_bytes": 48213,
  "sha256": "9f2c…",
  "nota_media": 0,
  "votos": 0,
  "versoes": [{ "id": "5c1d…", "versao": "1.0.0", "estado": "submetido", "ref": "v1.0.0", "commit_sha": "1a9f…", "…": "…" }],
  "…": "…"
}
```

## Erros

Todos no formato `{ "codigo": "...", "erro": "mensagem" }`. A mensagem diz o que corrigir e pode ser mostrada direto ao autor.

| Status | `codigo` | Quando |
| --- | --- | --- |
| 400 | `REQUISICAO_INVALIDA` | Falta `repositorio_url` ou `ref`, ou a ref tem caracteres inválidos |
| 422 | `REPOSITORIO_INVALIDO` | URL fora do formato `https://github.com/<dono>/<repo>`, ou repositório inexistente/privado |
| 422 | `REF_NAO_ENCONTRADA` | A tag não existe no repositório |
| 422 | `PACOTE_GRANDE` | Mais de 20 MB compactado (ou 100 MB descompactado) |
| 422 | `PACOTE_INVALIDO` | O GitHub devolveu algo que não abre como zip |
| 422 | `SEM_INDEX` | Sem `index.html` na raiz |
| 422 | `SEM_MANIFESTO` | Sem `game.json` na raiz |
| 422 | `MANIFESTO_INVALIDO` | `game.json` ou `questoes.json` com JSON quebrado, campo faltando ou inválido, ou apontando para arquivo que não existe |
| 422 | `POUCAS_QUESTOES` | Menos de 20 questões |
| 422 | `QUESTAO_SEM_FONTE` | Questão sem `fonte` (a mensagem lista os ids) |
| 409 | `ID_EM_USO` | O `id` do `game.json` já pertence a outro repositório |
| 409 | `VERSAO_JA_SUBMETIDA` | Essa `versao` do jogo já foi submetida e não foi reprovada |
| 503 | `GITHUB_INDISPONIVEL` | Falha ao falar com o GitHub ou limite de requisições atingido |

## Limite do GitHub

Sem token, a API do GitHub aceita 60 requisições por hora por IP, e cada submissão usa uma ou duas. Para subir para 5000 por hora, defina `GITHUB_TOKEN` com um [fine-grained token](https://github.com/settings/personal-access-tokens/new) sem nenhuma permissão extra (só leitura de repositórios públicos), no `.env` e nas variáveis do Render.
