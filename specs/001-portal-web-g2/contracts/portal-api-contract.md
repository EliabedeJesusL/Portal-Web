# Interface & API Contracts: Portal Web Recreio Arcade (G2)

**Feature**: `001-portal-web-g2`
**Data**: 2026-10-15
**Contexto**: Mapeamento dos contratos externos e internos consumidos e expostos pelo Portal Web. O Portal não cria nem altera endpoints da API.

---

## 1. Contrato HTTP com a API Oficial G1

Toda comunicação transita exclusivamente por `web/src/api.ts`.

| Operação | Método | Rota | Cabeçalhos | Request Body | Resposta Sucesso | Erros Mapeados |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **Health Check** | `GET` | `/health` | `Accept: application/json` | - | `{ ok: true, service: "..." }` | Falha de rede / Cold start |
| **Listar Jogos** | `GET` | `/jogos?status={status}` | `Accept: application/json` | - | `Game[]` (status padrão: aprovado) | Falha de rede |
| **Obter Jogo** | `GET` | `/jogos/{id}` | `Accept: application/json` | - | `Game` com feedbacks e taxas | 404 (Jogo não encontrado) |
| **Submeter Jogo** | `POST` | `/jogos` | `Content-Type: application/json` | `{ repositorio_url, ref, resumo? }` | `201 Created` (`Game`) | 400 (Campos inválidos), 409 (ID em uso / Versão já submetida), 422 (Repositório inválido, poucas questões, questão sem fonte), 503 (GitHub) |
| **Fila de Curadoria** | `GET` | `/jogos?status=submetido` | `Accept: application/json` | - | `Game[]` (versões pendentes) | Falha de rede |
| **Validar Curador** | `GET` | `/curadores/eu` | `Authorization: Bearer cur_...` | - | `{ id: "...", nome: "..." }` | 401 (Token inválido ou não informado) |
| **Decidir Versão** | `POST` | `/versoes/{id}/decisao` | `Authorization: Bearer cur_...` | `{ decisao: "aprovado"\|"reprovado", justificativa? }` | `Game` atualizado | 401 (Não autenticado), 404 (Versão inexistente), 409 (Já decidida), 422 (Justificativa obrigatória) |
| **Ranking Jogadores** | `GET` | `/ranking/jogadores?jogo={id}&limite=100` | `Accept: application/json` | - | `PlayerRank[]` | 400 (Sem ?jogo=), 404 (Jogo inexistente) |
| **Ranking de Jogos** | `GET` | `/ranking/jogos` | `Accept: application/json` | - | `GameRank[]` | Falha de rede |
| **Anonimizar Jogador**| `POST` | `/ranking/jogadores/anonimizar` | `Authorization: Bearer cur_...` | `{ apelido: "...", jogo?: "..." }` | `{ ok: true, apelido_anterior, apelido_novo: "ANON", partidas?, votos? }` | 400 (Apelido inválido ou ANON), 401 (Não autenticado), 404 (Apelido ou jogo não encontrado) |

---

## 2. Contratos Internos dos Componentes React (`web/src/components/`)

### `Header`
- **Props**: Nenhuma.
- **Responsabilidade**: Renderização do topo, logo retrô, navegação principal com marcação ativa, estado do servidor da API (com suporte contínuo a cold start) e menu hambúrguer responsivo.

### `Footer`
- **Props**: Nenhuma.
- **Responsabilidade**: Rodapé informativo com referência ao G2 e proveniência dos dados da API.

### `Layout`
- **Props**:
  - `title`: `string` (título principal da tela em h1 neon).
  - `eyebrow?`: `string` (etiqueta superior contextual, ex: `"PLATAFORMA DE GESTÃO"`).
  - `children`: `ReactNode` (conteúdo da tela).
- **Responsabilidade**: Estruturar casca padrão (`Header` + `main.page` + `Footer`).

### `ErrorBox`
- **Props**:
  - `message`: `string` (mensagem explicativa em texto plano).
- **Responsabilidade**: Exibir caixas de aviso de erro estilizadas com contraste e ícone.

### `Loading`
- **Props**:
  - `message?`: `string` (mensagem opcional, padrão: `"CONSULTANDO API..."`).
  - `isColdStart?`: `boolean` (indica se deve exibir aviso explicativo sobre cold start).
- **Responsabilidade**: Indicador visual de progresso e carregamento.

### `GameCard`
- **Props**:
  - `game`: `Game`.
- **Responsabilidade**: Card de catálogo com capa (ou fallback de ícone), autores, tags de tema/nível e nota/votos.

### `CuratorLogin`
- **Props**:
  - `onValidated`: `(name: string) => void`.
- **Responsabilidade**: Formulário para inserção e validação do token `cur_...`.

### `FormulaModal`
- **Props**:
  - `isOpen?`: `boolean`.
  - `onClose?`: `() => void`.
- **Responsabilidade**: Detalhamento didático e visual do cálculo da nota ajustada ponderada (m=5).

---

## 3. Contratos de Rotas do Portal (`web/src/App.tsx`)

| Rota | Componente de Página | Visibilidade | Parâmetros |
| :--- | :--- | :--- | :--- |
| `/` | `Catalogo` | Pública | - |
| `/catalogo` | `Catalogo` | Pública | - |
| `/jogos/:id` | `Detalhes` | Pública | `id`: ID do jogo |
| `/enviar` | `Enviar` | Pública | - |
| `/moderacao` | `Moderacao` | Pública (ações exigem token) | - |
| `/ranking/jogadores` | `RankingJogadores` | Pública (anonimização exige token) | - |
| `/ranking/jogos` | `RankingJogos` | Pública | - |
| `*` | `Catalogo` (fallback) | Pública | - |
