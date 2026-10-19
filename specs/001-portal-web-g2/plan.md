# Implementation Plan: Retrofit Modular do Portal Web G2

**Branch**: `001-portal-web-g2` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-portal-web-g2/spec.md`

## Summary

O Portal Web (`web/`) já possui todas as funcionalidades de interface implementadas em React 19 + TypeScript + Vite + React Router, consumindo a API oficial do G1 (`api/`). No entanto, o código encontra-se concentrado monoliticamente em `web/src/App.tsx` (961 linhas) enquanto os diretórios `web/src/pages/` e `web/src/components/` contêm apenas arquivos vazios (0 bytes), além de desvios pontuais em relação à Constituição do projeto (permissão `allow-forms` no sandbox do preview, fallback de erro técnico `Erro HTTP ${status}` em `api.ts`, tolerância contínua a cold start e ausência de `:focus-visible`).

Este plano estabelece a estratégia de **retrofit cirúrgico**: extrair as funções de componentes e páginas para seus respectivos arquivos existentes, corrigir os pontos de conformidade e preservar 100% dos comportamentos funcionais, rotas e textos exibidos, com validação via `npm run typecheck` e `npm run build:web`.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+
**Primary Dependencies**: React 19, React Router DOM 7, Lucide React 0.468, Vite 8
**Storage**: `sessionStorage` do navegador (chave exclusiva `'recreio-arcade-curador-token'`)
**Testing**: Compilação de tipos (`npm run typecheck`) e build de produção (`npm run build:web`). A API G1 possui 151 testes Vitest (`npm run test:api`). Nenhum framework novo de teste é introduzido no frontend para manter o retrofit enxuto.
**Target Platform**: Navegadores modernos (layout responsivo desktop e mobile a partir de 320px)
**Project Type**: Single Page Application (SPA) - Cliente Web (G2)
**Performance Goals**: Renderização ágil e tolerância a cold start de até 60 segundos em hospedagens gratuitas (Render)
**Constraints**:
- Comunicação HTTP restrita exclusivamente a `web/src/api.ts`.
- Sem alterações nos contratos nem esquemas de dados da API G1.
- Token de curador armazenado exclusivamente em `sessionStorage`.
- Preview de jogos isolado em `<iframe sandbox="allow-scripts">` (sem `allow-same-origin` e sem `allow-forms`).
- Dados de usuário e da API renderizados estritamente como texto plano (anti-XSS).

---

## Constitution Check

*GATE: Avaliação de conformidade com os 8 princípios da Constituição do Recreio Arcade (v1.0.0).*

| Princípio | Requisito da Constituição | Status no Plano | Justificativa / Mecanismo de Conformidade |
| :--- | :--- | :---: | :--- |
| **1. Fronteiras e Responsabilidade** | O Portal atua estritamente como cliente: não recalcula notas, não valida pacotes, não cria fontes paralelas de dados. HTTP somente por `api.ts`. | **PASSA** | Toda chamada transita exclusivamente por `web/src/api.ts`. O Portal não recalcula notas nem valida pacotes. As fronteiras com G3 e G4 são integralmente respeitadas. |
| **2. Contrato da API** | Submissão com `repositorio_url` + `ref` + `resumo`. Ranking de jogadores por jogo. Ranking de jogos com nota ajustada e fórmula explicada na tela. | **PASSA** | Contrato consumido sem alterações. Explicação da nota ajustada exibida em `RankingJogos.tsx`. Formulário de envio mantém somente os campos da API. |
| **3. Autenticação e Segurança** | Token em `sessionStorage` apenas. Iframe sandbox com `allow-scripts` (sem `allow-same-origin` e sem `allow-forms`). Texto plano contra XSS. | **PASSA** | Token validado persiste estritamente em `sessionStorage`. O iframe de preview tem `allow-forms` removido cirurgicamente. Todo dado textual é interpolado com escape nativo do React. |
| **4. Qualidade e Testes** | Tipagem estática (`tsc`) e build sem erros. Mensagens de erro amigáveis e acionáveis, proibida a exposição de códigos técnicos (`Erro HTTP <status>`) ou telas em branco. | **PASSA** | O fallback de `api.ts` é substituído por mensagens amigáveis em português. Validação obrigatória via `npm run typecheck` e `npm run build:web`. |
| **5. UX do Portal** | Identidade retrô neon/escuro. Acessibilidade com foco visível no teclado. Layout responsivo. Estados de loading/vazio/erro explícitos. Tolerância contínua a cold start. | **PASSA** | `:focus-visible` adicionado no `styles.css`. Estados de loading, empty e error preservados em cada tela. `Header` e telas ganham tolerância visual contínua com polling e retentativa para cold start. |
| **6. Organização do Código** | Páginas em `web/src/pages/`, componentes em `web/src/components/`, preservando 100% do comportamento existente. | **PASSA** | Migração das 7 funções de componentes e 6 páginas para seus arquivos dedicados existentes, deixando `App.tsx` exclusivamente com as rotas. |
| **7. Fluxo Spec-Driven** | Ciclo `spec` → `clarify` → `plan` → `tasks` → `implement`. Rastreamento oficial aos requisitos RF-G01 a RF-G16. | **PASSA** | Execução orientada pelo Spec Kit, com spec aprovada e rastreada a todos os requisitos do G2. |
| **8. Governança** | Precedência da Constituição sobre convenções locais. Nenhuma exceção não documentada. | **PASSA** | Alinhamento integral às diretrizes ratificadas na Constituição. Nenhuma violação ou exceção detectada. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-portal-web-g2/
├── spec.md              # Especificação de requisitos da feature
├── plan.md              # Este plano de implementação
├── research.md          # Decisões técnicas e pesquisa de conformidade (Fase 0)
├── data-model.md        # Modelo de dados das entidades de frontend (Fase 1)
├── quickstart.md        # Guia executável de validação ponta a ponta (Fase 1)
├── contracts/           # Contratos de interfaces e endpoints (Fase 1)
│   └── portal-api-contract.md
├── checklists/
│   └── requirements.md  # Checklist de qualidade da especificação
└── tasks.md             # Tarefas atômicas de implementação (Fase 2 - gerado pelo /speckit.tasks)
```

### Source Code (`web/src/`)

```text
web/src/
├── main.tsx             # Ponto de entrada da aplicação (inalterado)
├── styles.css           # Estilos visuais globais (adição de :focus-visible)
├── vite-env.d.ts        # Tipagens do Vite (inalterado)
├── api.ts               # Cliente HTTP centralizado (humanização de erros e cold start)
├── App.tsx              # Roteador central (apenas declaração de Routes e Route)
├── components/
│   ├── Header.tsx       # Topo com navegação e status da API com tolerância a cold start
│   ├── Footer.tsx       # Rodapé visual padrão
│   ├── Layout.tsx       # Estrutura padrão de página (inclui Loading)
│   ├── ErrorBox.tsx     # Caixa de mensagem de erro
│   ├── GameCard.tsx     # Card de exibição do jogo no catálogo
│   ├── CuratorLogin.tsx # Formulário de autenticação de curador
│   └── FormulaModal.tsx # Componente explicativo da média ponderada da nota ajustada
└── pages/
    ├── Catalogo.tsx     # Página do catálogo público de jogos aprovados
    ├── Detalhes.tsx     # Página de detalhes, versões, feedbacks e taxas por tema
    ├── Enviar.tsx       # Página de submissão de novos jogos por repositório GitHub
    ├── Moderacao.tsx    # Painel de curadoria com fila e preview seguro (sandbox allow-scripts)
    ├── RankingJogadores.tsx # Ranking de jogadores por jogo e ação de anonimização
    └── RankingJogos.tsx # Ranking de jogos com nota ajustada e explicação da métrica
```

---

## Estratégia de Refatoração e Sequência de Extração

A refatoração será executada em fases incrementais para assegurar que a tipagem e o build passem após cada etapa:

### Etapa 1: Componentes Base e Utilitários (`web/src/components/`)
1. **`ErrorBox.tsx`**: Extrair a função `ErrorBox({ message }: { message: string })`. Depende de `XCircle` de `lucide-react`.
2. **`Layout.tsx`**: Extrair `Layout` e `Loading`. `Layout` depende de `Header`, `Footer` e `ReactNode`. `Loading` suporta mensagem customizada ou aviso de cold start.
3. **`Footer.tsx`**: Extrair a função `Footer()`. Depende apenas de JSX puro.
4. **`Header.tsx`**: Extrair a função `Header()`. Implementa o indicador de status da API com estados para cold start e retentativa em caso de falha transitória inicial.
5. **`GameCard.tsx`**: Extrair a função `GameCard({ game }: { game: Game })`. Depende de `Link` (`react-router-dom`), `Gamepad2`, `Star` (`lucide-react`) e do tipo `Game` de `../api`.
6. **`CuratorLogin.tsx`**: Extrair a função `CuratorLogin({ onValidated })`. Depende de `api`, `getStoredCuratorToken`, `setCuratorToken`, `clearCuratorToken`, `getApiErrorMessage` de `../api`, `ErrorBox` e `KeyRound`.
7. **`FormulaModal.tsx`**: Componente visual expondo a fórmula e explicação detalhada da métrica de nota ajustada.

### Etapa 2: Páginas do Portal (`web/src/pages/`)
1. **`Catalogo.tsx`**: Extrair `Catalogo()`. Importa `Layout`, `GameCard`, `ErrorBox`, `api`, `Game` e `UploadCloud`.
2. **`Detalhes.tsx`**: Extrair `Detalhes()`. Importa `Layout`, `ErrorBox`, `useParams`, `Link`, `api`, `Game`, ícones Lucide.
3. **`Enviar.tsx`**: Extrair `Enviar()`. Importa `Layout`, `ErrorBox`, `api`, `CheckCircle2`, `Github`.
4. **`Moderacao.tsx`**: Extrair `Moderacao()`. Importa `Layout`, `CuratorLogin`, `ErrorBox`, `api`, `getStoredCuratorToken`, `clearCuratorToken`, ícones Lucide. Corrige o atributo do iframe para `sandbox="allow-scripts"` (sem `allow-forms`). Adiciona o aviso orientador de governança RF-G15.
5. **`RankingJogadores.tsx`**: Extrair `RankingJogadores()`. Importa `Layout`, `ErrorBox`, `api`, `getStoredCuratorToken`, tipos e ícones.
6. **`RankingJogos.tsx`**: Extrair `RankingJogos()`. Importa `Layout`, `ErrorBox`, `api`, `GameRank`, `FormulaModal` e ícones.

### Etapa 3: Redução do `web/src/App.tsx`
- Remover todas as funções de componentes e páginas que foram extraídas.
- Importar as 6 páginas de `./pages/*.tsx`.
- Manter unicamente o componente `App` com o elemento `Routes` e as 7 rotas (`/`, `/catalogo`, `/jogos/:id`, `/enviar`, `/moderacao`, `/ranking/jogadores`, `/ranking/jogos`, `*`).

### Etapa 4: Correções de Conformidade em `web/src/api.ts` e `web/src/styles.css`
1. Em `web/src/api.ts`:
   - Substituir o fallback `Erro HTTP ${response.status}` pela função `mapHttpStatusToFriendlyMessage(status)` em português.
   - Preservar `errorBody?.erro` quando retornado pela API G1.
2. Em `web/src/styles.css`:
   - Adicionar regras para `:focus-visible` em botões, links de navegação, itens de fila e cards.

---

## Validação de Equivalência

A garantia de não regressão e equivalência estrita será verificada através dos seguintes pilares:
1. **Verificação de Tipagem Estática**:
   - `npm run typecheck` (`tsc -b api && tsc -b web`) deve passar sem nenhum erro.
2. **Build de Produção**:
   - `npm run build:web` (`vite build`) deve gerar o bundle de produção sem avisos nem falhas.
3. **Equivalência de Rotas e Textos**:
   - Nenhuma rota do roteador foi adicionada, renomeada ou removida.
   - Todos os textos, rótulos, classes CSS e cabeçalhos permanecem idênticos aos da versão original em `App.tsx`.
4. **Equivalência de Chamadas HTTP**:
   - Todos os endpoints e payloads consumidos permanecem idênticos aos já invocados via `api.ts`.

---

## Complexity Tracking

> Nenhuma violação à Constituição foi introduzida; portanto, nenhuma justificativa de complexidade adicional é necessária.
