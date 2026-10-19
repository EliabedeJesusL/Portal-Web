# Data Model: Portal Web Recreio Arcade (G2)

**Feature**: `001-portal-web-g2`
**Data**: 2026-10-15
**Diretriz**: Este modelo de dados é estritamente de leitura e espelhamento no cliente Web. Ele referencia exclusivamente os tipos estabelecidos em `web/src/api.ts` e documentados em `api/docs/*.md`. Nenhuma entidade nova, tabela ou alteração de contrato de banco de dados é introduzida.

---

## Entidades Principais (Frontend Client)

### 1. Jogo (`Game`)
Representa o registro consolidado de um jogo educativo aprovado ou em moderação.
- **Campos**:
  - `id`: string (identificador único persistente do jogo, kebab-case, ex: `"quiz-invaders"`).
  - `nome`: string (título oficial exibido do jogo).
  - `descricao`: string (descrição detalhada do jogo).
  - `resumo`: string (resumo curto de até 300 caracteres).
  - `classico_referencia`: string | undefined (inspiração clássica, ex: `"Space Invaders"`).
  - `mecanica`: string | undefined (`"tiro"`, `"plataforma"`, `"labirinto"`, `"encaixe"`, `"corrida"`).
  - `tema`: string (tema pedagógico do jogo, ex: `"Matemática"`, `"História"`).
  - `nivel`: string (nível educacional, ex: `"ensino médio"`).
  - `autores`: string[] (lista de autores do jogo).
  - `controles`: string (instruções de comandos/teclas).
  - `versao`: string (versão SemVer em foco, ex: `"1.0.0"`).
  - `status`: `EstadoVersao` (`"submetido" | "aprovado" | "reprovado" | "substituida"`).
  - `capa_url`: string | undefined (URL absoluta da imagem de capa fornecida pela API).
  - `preview_url`: string | undefined (URL absoluta para carregar no iframe de preview).
  - `pacote_url`: string | undefined (URL do zip para download pelo fliperama).
  - `versao_id`: string | undefined (UUID da versão em foco).
  - `nota_media`: number (média aritmética das avaliações dos jogadores, de 0 a 5).
  - `votos`: number (total de avaliações computadas).
  - `jogadores_distintos`: number | undefined (quantidade de jogadores únicos que jogaram).
  - `partidas_jogadas`: number | undefined (número total de partidas registradas).
  - `versoes`: `GameVersion[]` | undefined (histórico de versões submetidas).
  - `feedbacks`: `Feedback[]` | undefined (avaliações e comentários recentes).
  - `taxa_acerto_tema`: `AccuracyByTheme[]` | undefined (estatísticas cognitivas por tema).

---

### 2. Versão do Jogo (`GameVersion`)
Histórico de uma iteração de publicação de um jogo.
- **Campos**:
  - `id`: string (UUID da versão).
  - `jogo_id`: string | undefined (ID do jogo pertencente).
  - `versao`: string (número SemVer da versão).
  - `estado`: `EstadoVersao` (`"submetido" | "aprovado" | "reprovado" | "substituida"`).
  - `ref`: string | undefined (tag ou branch do GitHub de origem).
  - `commit_sha`: string | undefined (SHA-1 do commit no GitHub).
  - `submetido_em`: string | undefined (data ISO-8601 do envio).
  - `decidido_em`: string | undefined (data ISO-8601 da moderação).
  - `decidido_por`: string | undefined (nome do curador que decidiu).
  - `justificativa`: string | undefined (motivo pedagógico/técnico da reprovação ou nota da aprovação).
  - `preview_url`: string | undefined (URL para execução isolada).

---

### 3. Feedback do Jogador (`Feedback`)
Registro individual de avaliação e comentário deixado ao final de uma partida no fliperama.
- **Campos**:
  - `partida_id`: string | undefined (UUID da partida).
  - `apelido`: string (apelido do jogador ou `"ANON"`).
  - `nota`: number (inteiro de 1 a 5).
  - `comentario`: string | undefined (texto opinativo deixado pelo jogador).
  - `criado_em`: string | undefined (data ISO-8601).

---

### 4. Taxa de Acerto por Tema (`AccuracyByTheme`)
Agregação estatística de acertos e erros de perguntas educacionais.
- **Campos**:
  - `tema`: string (nome do tema, ex: `"Geometria"`).
  - `acertos`: number (contagem de respostas corretas).
  - `erros`: number (contagem de respostas erradas).
  - `taxa`: number (percentual de acertos, formatado com uma casa decimal).

---

### 5. Ranking de Jogador (`PlayerRank`)
Desempenho de um jogador para um jogo específico.
- **Campos**:
  - `posicao`: number (ordem de classificação 1..N).
  - `apelido`: string (letras maiúsculas e números, até 9 caracteres).
  - `pontos`: number (maior pontuação obtida pelo jogador no jogo).
  - `jogo_id`: string (ID do jogo).
  - `jogo`: string (nome do jogo).
  - `partidas`: number | undefined (total de partidas disputadas pelo jogador naquele jogo).
  - `acertos`: number | undefined (acertos na melhor partida).
  - `erros`: number | undefined (erros na melhor partida).
  - `duracao_s`: number | undefined (duração em segundos da melhor partida).
  - `jogado_em`: string | undefined (timestamp ISO-8601 da melhor partida).

---

### 6. Ranking de Jogos (`GameRank`)
Classificação comparativa de qualidade dos jogos baseada na nota ajustada.
- **Campos**:
  - `posicao`: number (ordem de classificação 1..N).
  - `jogo_id`: string (identificador do jogo).
  - `jogo`: string (nome do jogo).
  - `nota`: number (média simples de notas, 0 a 5).
  - `votos`: number (quantidade total de votos recebidos).
  - `partidas`: number (quantidade de partidas jogadas).
  - `jogadores_distintos`: number (jogadores únicos sem contar anônimos).
  - `nota_ajustada`: number (nota calculada pela média ponderada com m=5).

---

### 7. Sessão do Curador (`CuratorSession`)
Estado volátil em memória do navegador para o operador de moderação.
- **Armazenamento**: `sessionStorage` sob a chave `'recreio-arcade-curador-token'`.
- **Campos**:
  - `token`: string (formato `cur_...`).
  - `nome`: string (obtido via `GET /api/curadores/eu`).
  - `autenticado`: boolean.

---

## Máquina de Estados da Versão (Governado pela API G1)

```
       [ Submissão de Jogo (Enviar.tsx) ]
                       │
                       ▼
                 ┌───────────┐
                 │ submetido │
                 └─────┬─────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────┐               ┌───────────────┐
│  reprovado   │               │   aprovado    │
│(justificativa│               └───────┬───────┘
│ obrigatória) │                       │
└──────────────┘                       │ (quando nova versão
                                       │  é aprovada)
                                       ▼
                               ┌───────────────┐
                               │  substituida  │
                               └───────────────┘
```
