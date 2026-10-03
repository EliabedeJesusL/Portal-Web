# Catálogo, download e preview

Rotas públicas (sem token). Todas as URLs que a API devolve são absolutas, montadas com o domínio pelo qual ela foi chamada.

## Catálogo

```http
GET /api/jogos                     # aprovados (padrão)
GET /api/jogos?status=submetido    # fila da curadoria
GET /api/jogos?status=reprovado
GET /api/jogos?status=substituida
```

Devolve uma lista de jogos. Cada item traz os dados do jogo e da **versão em foco**: a versão naquele `status`. Em `aprovado` há no máximo uma por jogo; em `submetido`, um jogo com duas versões pendentes aparece duas vezes.

```json
[
  {
    "id": "jogo-exemplo",
    "nome": "Quiz Invaders (exemplo)",
    "descricao": "…",
    "resumo": "…",
    "autores": ["G1 — Plataforma de Gestão"],
    "controles": "…",
    "classico_referencia": "Space Invaders",
    "mecanica": "tiro",
    "tema": "Matemática",
    "nivel": "ensino médio",
    "capa": "capa.png",
    "repositorio_url": "https://github.com/Arcade-IFES/jogo-exemplo",

    "versao": "1.0.0",
    "status": "aprovado",
    "versao_id": "44caf359-…",
    "tamanho_bytes": 8200,
    "sha256": "de6bba7d…",

    "capa_url": "https://…/api/versoes/44caf359-…/preview/capa.png",
    "preview_url": "https://…/api/versoes/44caf359-…/preview/index.html",
    "pacote_url": "https://…/api/jogos/jogo-exemplo/pacote?versao=1.0.0",

    "nota_media": 4.33,
    "votos": 3,
    "jogadores_distintos": 3,
    "partidas_jogadas": 6,
    "versoes": [ { "id": "…", "versao": "1.0.0", "estado": "aprovado", "preview_url": "…", "…": "…" } ]
  }
]
```

- `capa_url`: use no `<img>` do Portal.
- `preview_url`: use no iframe da curadoria (veja abaixo).
- `pacote_url`: só aparece em versões que o fliperama pode baixar (`aprovado` ou `substituida`).

## Detalhe

```http
GET /api/jogos/{id}
```

O mesmo objeto do catálogo, focando a versão aprovada (ou a mais recente, se nenhuma foi aprovada), com mais dois campos:

```json
{
  "…": "…",
  "feedbacks": [
    { "partida_id": "…", "apelido": "ANA", "nota": 5, "comentario": "Muito bom", "criado_em": "…" }
  ],
  "taxa_acerto_tema": [
    { "tema": "Matemática", "acertos": 72, "erros": 9, "taxa": 88.9 }
  ]
}
```

`taxa` é o percentual de acertos, com uma casa decimal. Jogo inexistente: `404 JOGO_NAO_ENCONTRADO`.

## Download do pacote (fliperama / G3)

```http
GET /api/jogos/{id}/pacote              # versão aprovada atual
GET /api/jogos/{id}/pacote?versao=1.0.0 # versão específica (aprovada ou substituída)
```

Devolve o zip com o jogo **na raiz** (`index.html`, `game.json`, …), com os cabeçalhos:

| Cabeçalho | Valor |
| --- | --- |
| `ETag` | `"<sha256>"` |
| `X-Sha256` | sha256 do zip, para conferir depois de baixar |
| `X-Versao` | número da versão entregue |
| `Cache-Control` | `no-cache` sem `versao`; `immutable` com `versao` |

Versão submetida, reprovada ou inexistente: `404 PACOTE_NAO_ENCONTRADO`.

### Sincronização sugerida

1. `GET /api/jogos` e compare o `sha256` de cada jogo com o que está no disco.
2. Para cada jogo novo ou com `sha256` diferente, baixe o `pacote_url`.
3. Confira que o sha256 do arquivo baixado bate com `X-Sha256` antes de extrair.
4. Jogos que sumiram do catálogo podem ser removidos.

Para economizar banda, mande `If-None-Match: "<sha256 que você tem>"`: se nada mudou, a resposta é `304` sem corpo.

## Preview (curadoria / G2)

```http
GET /api/versoes/{versao_id}/preview/            # entrada do jogo (index.html)
GET /api/versoes/{versao_id}/preview/js/jogo.js  # qualquer arquivo do pacote
```

Serve os arquivos de dentro do pacote de **qualquer versão**, inclusive `submetido`, para o curador jogar antes de decidir:

```html
<iframe src="{preview_url}" width="1024" height="768"></iframe>
```

O jogo roda com `Content-Security-Policy: sandbox allow-scripts`, numa origem isolada: ele não acessa nada da API nem do Portal. Por isso `localStorage` e cookies não funcionam dentro do preview, o que não afeta o jogo no fliperama.
