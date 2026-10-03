# Integração com os outros grupos

O que cada grupo precisa fazer para usar a API oficial do G1 no lugar dos mocks.

- **Base da API:** `https://plataforma-gestao-api.onrender.com/api`
- **Swagger (testar pelo navegador):** <https://plataforma-gestao-api.onrender.com/docs>
- **CORS:** liberado para qualquer origem.
- **Erros:** sempre `{ "codigo": "...", "erro": "mensagem" }`; o `erro` diz o que corrigir e pode ser mostrado ao usuário.
- **Jogo aprovado para testar:** [`jogo-exemplo`](https://github.com/Arcade-IFES/jogo-exemplo).

**Decisão da turma (23/09):** o apelido é digitado **dentro do jogo** no fim da partida; o fliperama continua pedindo a nota; o ranking de jogadores é **só por jogo**. Detalhes em [placares.md](placares.md).

## G2 — Portal

1. **Submissão** (`POST /api/jogos`): o corpo agora é só `{ repositorio_url, ref, resumo? }`. O `ref` é a tag do repositório (ex.: `v1.0.0`). Nome, autores, descrição e o resto vêm do `game.json` do jogo, então o formulário não precisa pedir. Erros de validação vêm como `422`.
2. **Login de curador:** o curador cola o token dele (`cur_...`). Para validar e pegar o nome, `GET /api/curadores/eu` com `Authorization: Bearer <token>`. O mesmo cabeçalho vale para decidir versões, criar estações e anonimizar. O campo `curador` no corpo da decisão é ignorado: quem decide é o dono do token.
3. **Curadoria:** a fila é `GET /api/jogos?status=submetido`. Cada item traz `versao_id` (para `POST /api/versoes/{versao_id}/decisao`) e `preview_url` (para jogar no iframe antes de decidir). Reprovar exige justificativa.
4. **Ranking de jogadores:** só por jogo. Chame sempre `/api/ranking/jogadores?jogo=<id>`; sem o jogo, a resposta é `400`. O ranking geral saiu.
5. **Campos novos:** `capa_url` (para o `<img>`), `preview_url` (para o iframe) e, nos jogos aprovados, `pacote_url`.

Guias: [catalogo.md](catalogo.md), [curadoria.md](curadoria.md), [ranking.md](ranking.md), [submissao.md](submissao.md).

## G3 — Fliperama

1. **Token da estação:** cada fliperama precisa de um, criado por um curador (veja [Criar uma estação](#criar-uma-estação-curador)). Ele vai em toda chamada de placar: `Authorization: Bearer est_...`.
2. **Sincronizar os jogos:**
   - `GET /api/jogos` lista os aprovados, cada um com `sha256` e `pacote_url`.
   - Se o `sha256` for diferente do que está no disco, baixe o `pacote_url`: é um zip com o jogo na raiz (`index.html`, `game.json`, ...).
   - Confira que o sha256 do arquivo baixado bate com o cabeçalho `X-Sha256`.
   - Com `If-None-Match: "<sha256>"`, se nada mudou, a resposta é `304`, sem baixar de novo.
3. **Placar:** no fim da partida, o jogo manda a mensagem `PLACAR` por `postMessage`, já com o campo `jogador`. O fliperama pede a nota do jogo (1 a 5) e envia:

   ```http
   POST /api/placares
   Authorization: Bearer est_...
   Content-Type: application/json

   {
     "id_partida": "<UUID gerado pelo fliperama>",
     "jogo": "jogo-exemplo",
     "jogador": "ANA",
     "pontos": 1450,
     "duracao_s": 95,
     "acertos": 8,
     "erros": 2,
     "tema": "Matemática",
     "jogado_em": "2026-09-27T14:30:00-03:00",
     "feedback": { "nota": 5, "comentario": "..." }
   }
   ```

   - `201` para partida nova, `200` se a mesma já tinha chegado. Se a rede falhar, reenvie com o **mesmo** `id_partida`, sem risco de duplicar.
   - `/api/resultados` continua funcionando por enquanto, mas é temporário: migre para `/api/placares`.
4. **Teste de ponta a ponta:** o `jogo-exemplo` já está aprovado e manda o `PLACAR` com o apelido. Depois de jogar, o placar aparece em `GET /api/ranking/jogadores?jogo=jogo-exemplo`.

Guias: [catalogo.md](catalogo.md), [placares.md](placares.md).

## G4 — Jogos

Hoje nenhum jogo da org passa na validação:

| Repositório | Falta |
| --- | --- |
| Snake | `game.json` |
| Quiz do Espaço, Órbita do Saber, Corrida Contra o Sino, Logic Dungeon | `index.html` na raiz |

Cada repositório precisa:

- ser **público**;
- ter na raiz `index.html`, `game.json` (manifesto), `questoes.json` e a capa;
- ter pelo menos **20 questões**, todas com `fonte` preenchida;
- ter no máximo **20 MB**.

No fim de cada partida, o jogo pede o **apelido** do jogador (A-Z e 0-9, até 9 caracteres) e manda a mensagem `PLACAR` ao fliperama com o campo `jogador`:

```js
window.parent.postMessage({
  tipo: 'PLACAR', jogo: '<id>', versao: '1.0.0', jogador: 'ANA',
  pontos: 1450, duracao_s: 95, acertos: 8, erros: 2, tema: 'Matemática',
}, '*')
```

O [`jogo-exemplo`](https://github.com/Arcade-IFES/jogo-exemplo) é um modelo pronto: passa na validação e tem a tela de apelido, que funciona só com joystick.

**Publicar uma versão:** aumente a `versao` no `game.json`, crie a tag (`git tag v1.0.0 && git push origin v1.0.0`) e submeta no Portal com o link do repositório e a tag. Se algo estiver errado, a mensagem de erro diz o que corrigir.

Guia completo (formato do `game.json` e do `questoes.json`, erros): [submissao.md](submissao.md).

## Criar uma estação (curador)

Com um token de curador, crie um token para cada fliperama e entregue ao G3 por um canal privado (ele aparece uma única vez):

```powershell
$h = @{ Authorization = "Bearer cur_..." }
Invoke-RestMethod "https://plataforma-gestao-api.onrender.com/api/estacoes" -Method Post -Headers $h -ContentType "application/json" -Body '{"nome":"Fliperama 1"}'
```

```bash
curl -X POST https://plataforma-gestao-api.onrender.com/api/estacoes \
  -H "Authorization: Bearer cur_..." -H "Content-Type: application/json" \
  -d '{"nome":"Fliperama 1"}'
```

Mais sobre tokens em [autenticacao.md](autenticacao.md).
