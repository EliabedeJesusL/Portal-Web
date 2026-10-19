# Research & Technical Decisions: Retrofit Modular do Portal Web G2

**Feature**: `001-portal-web-g2`
**Data**: 2026-10-15
**Contexto**: Retrofit do Portal Web (`web/`) em React 19 + TypeScript + Vite + React Router, consumindo a API oficial do G1 (`api/`).

---

## 1. Arquitetura de Componentes e Páginas (Modularização de `App.tsx`)

### Contexto
Atualmente, `web/src/App.tsx` possui 961 linhas acumulando toda a interface, todas as páginas e todos os componentes reutilizáveis. Os arquivos nas pastas `web/src/pages/` e `web/src/components/` existem, mas estão vazios (0 bytes). Isso viola frontalmente o Princípio 6 da Constituição (*Organização do Código do Portal: páginas em `web/src/pages/`, componentes em `web/src/components/`*).

### Decisão
Distribuir cirurgicamente o código existente utilizando exatamente os arquivos já criados:

1. **`web/src/components/`**:
   - `Header.tsx`: Componente de cabeçalho global com logo, menu responsivo mobile e indicador de status da API com tolerância a cold start.
   - `Footer.tsx`: Rodapé visual padrão.
   - `Layout.tsx`: Container padrão da aplicação (`Header` + `main.page` com título/eyebrow + `Footer`). Também exporta o utilitário visual `Loading` (ou arquivo dedicado caso preferível).
   - `ErrorBox.tsx`: Caixa de mensagem de erro estilizada com ícone `XCircle`.
   - `GameCard.tsx`: Card visual de exibição de jogo no catálogo (capa/placeholder, título, autores, tags, estrelas/votos).
   - `CuratorLogin.tsx`: Formulário de autenticação por token com persistência estrita em `sessionStorage`.
   - `FormulaModal.tsx`: Componente com o detalhamento explicativo da média ponderada da nota ajustada (m=5), que pode ser acionado ou exibido na página de ranking de jogos.

2. **`web/src/pages/`**:
   - `Catalogo.tsx`: Página `/` e `/catalogo` com listagem de jogos aprovados, estados de loading, empty e error.
   - `Detalhes.tsx`: Página `/jogos/:id` com dados detalhados do jogo, histórico de versões, feedbacks e taxas por tema.
   - `Enviar.tsx`: Página `/enviar` com formulário de submissão por GitHub (`repositorio_url`, `ref`, `resumo`).
   - `Moderacao.tsx`: Página `/moderacao` com painel de curadoria, fila de pendentes, preview isolado e decisão.
   - `RankingJogadores.tsx`: Página `/ranking/jogadores` com seletor de jogo e tabela de melhores pontuações.
   - `RankingJogos.tsx`: Página `/ranking/jogos` com classificação por nota ajustada e explicação da métrica.

3. **`web/src/App.tsx`**:
   - Reduzido exclusivamente à definição do roteador (`Routes`, `Route`), delegando a renderização para as páginas importadas.

### Racional
Essa divisão é 100% isomórfica ao comportamento atual: nenhuma propriedade, classe CSS ou comportamento funcional é alterado. A separação melhora a manutenibilidade, cumpre a Constituição e permite testabilidade e leitura isolada de cada módulo.

### Alternativas Consideradas
- *Manter tudo em `App.tsx`*: Rejeitado por violar o Princípio 6 da Constituição.
- *Reescrever utilizando biblioteca de componentes externa (ex: Tailwind, Radix UI)*: Rejeitado por violar o mandato de retrofit e a diretriz estrita do usuário ("NÃO trocar a stack nem reescrever o Portal").

---

## 2. Isolamento de Segurança do Preview de Jogos (Iframe Sandbox)

### Contexto
O arquivo `App.tsx` (linha 716) renderiza o preview de curadoria com:
```html
<iframe className="preview-frame" sandbox="allow-scripts allow-forms" src={selected.preview_url} />
```
O Princípio 3 da Constituição e o requisito FR-008 exigem explicitamente:
> *"A visualização interativa de jogos (preview) DEVE ser executada obrigatoriamente dentro de `<iframe sandbox="allow-scripts">`, sem a permissão `allow-same-origin`, garantindo o isolamento completo contra acesso ao armazenamento ou contexto do Portal."*

### Decisão
Remover `allow-forms`, mantendo estritamente:
```html
<iframe
  className="preview-frame"
  title={`Preview de ${selected.nome}`}
  src={selected.preview_url}
  sandbox="allow-scripts"
/>
```

### Racional
Jogos educativos do Recreio Arcade necessitam unicamente de execução de JavaScript no cliente (`allow-scripts`) para renderização em canvas/DOM e manipulação de áudio/controles. Conceder `allow-forms` abre brechas de segurança para submissão não autorizada de formulários ou phishing dentro do contexto de curadoria.

### Alternativas Consideradas
- *Adicionar `allow-same-origin`*: Expressamente vedado pela Constituição, pois permitiria que um jogo malicioso acessasse o `sessionStorage` do Portal e capturasse o token de curador autenticado.

---

## 3. Humanização e Centralização de Mensagens de Erro em `web/src/api.ts`

### Contexto
Em `web/src/api.ts` (linha 182), caso a resposta da API não seja um JSON no formato padronizado `{ "codigo": "...", "erro": "..." }`, existe o seguinte fallback:
```typescript
const message = errorBody?.erro || `Erro HTTP ${response.status}`
```
Isso viola o Princípio 4 da Constituição:
> *"Falhas e respostas de erro da API DEVEM ser apresentadas ao usuário final de maneira clara e acionável, sendo expressamente proibida a exposição de códigos técnicos internos, stack traces ou renderização de telas em branco."*

### Decisão
Refatorar a função de mapeamento de erros em `web/src/api.ts` para converter status HTTP brutos e falhas de rede em mensagens amigáveis em português:

```typescript
function mapHttpStatusToFriendlyMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Os dados informados são inválidos. Verifique as informações e tente novamente.'
    case 401:
      return 'Credencial inválida ou sessão expirada. Verifique seu token de curador.'
    case 403:
      return 'Você não possui permissão para executar esta ação.'
    case 404:
      return 'O recurso solicitado não foi encontrado no servidor.'
    case 409:
      return 'Ocorreu um conflito com o estado atual dos dados. A informação pode já ter sido processada.'
    case 422:
      return 'Não foi possível processar a requisição devido a inconsistências nas informações enviadas.'
    case 502:
    case 503:
    case 504:
      return 'O servidor da plataforma está temporariamente indisponível. Aguarde alguns instantes e tente novamente.'
    default:
      return 'Não foi possível comunicar com o servidor da plataforma. Tente novamente em instantes.'
  }
}
```
Caso `errorBody?.erro` exista, ele continuará sendo priorizado, pois as mensagens retornadas pela API G1 já são amigáveis e orientadas à ação (ex.: *"Questão q3 sem fonte"* ou *"Reprovação exige justificativa"*). Apenas quando o campo `erro` não vier ou o servidor retornar status bruto (ex.: 502 do proxy ou 500 sem corpo JSON), o fallback amigável será utilizado, eliminando completamente termos como `Erro HTTP 500`.

### Racional
Garante conformidade imediata com o Princípio 4, protegendo o usuário final de jargões técnicos e mensagens incompreensíveis.

---

## 4. Tolerância e Feedback Visual Contínuo a Cold Start

### Contexto
A API do G1 é frequentemente hospedada em planos gratuitos (ex.: Render), que suspendem instâncias inativas. Ao receber a primeira requisição após inatividade, a API pode levar entre 40 a 60 segundos para responder (*cold start*).
Atualmente, o `Header.tsx` executa apenas uma chamada pontual para `api.health()`. Se falhar no início ou demorar, a interface exibe imediatamente um ponto rosa com `API OFFLINE`, dando ao usuário a impressão errônea de que o sistema está fora do ar.

### Decisão
1. **No `Header`**:
   - Implementar estados claros: `'checking'` ("CONECTANDO..."), `'online'` ("API ONLINE"), `'cold-start'` ("INICIANDO SERVIDOR... (pode levar até 60s)") e `'offline'` ("API INDISPONÍVEL").
   - Adicionar retentativa automática a cada 5 segundos enquanto o servidor não estiver respondendo durante a carga inicial.
2. **Nas telas conectadas**:
   - Quando uma requisição de carregamento ultrapassar 3 segundos de espera, o componente `Loading` exibirá uma mensagem de apoio amigável: *"Aguardando resposta do servidor (em inicialização gratuita, a primeira conexão pode levar até 1 minuto)..."*.

### Racional
Atende diretamente ao Princípio 5 da Constituição (*Tolerância a cold start da API, com feedback visual contínuo*) e ao requisito FR-017, reduzindo o abandono e a sensação de aplicação inoperante.

---

## 5. Acessibilidade por Teclado e Foco Visível (`:focus-visible`)

### Contexto
O arquivo `web/src/styles.css` estiliza foco com borda cyan e sombra apenas para `<input>`, `<textarea>` e `<select>`. Elementos cruciais como botões (`.arcade-button`, `.queue-item`, `.text-button`), links (`.main-nav a`, `.back-link`, `.external-link`) e cards (`.game-card`) não possuem estilos dedicados para navegação por teclado (`:focus-visible`).

### Decisão
Adicionar regras CSS no `styles.css` contemplando `:focus-visible` em alto contraste retrô:
```css
:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
  box-shadow: 0 0 10px rgba(0, 245, 255, 0.7);
}
```
E refinar botões e cards para responderem perfeitamente a navegação por `Tab` e ativação por `Enter`/`Espaço`.

### Racional
Atende ao Princípio 5 da Constituição e ao requisito FR-018, garantindo conformidade com padrões de acessibilidade sem descaracterizar o design retro arcade.

---

## 6. Resolução das Decisões de Negócio Clarificadas

1. **Ranking de Jogadores (RF-G07)**:
   - A tela `RankingJogadores.tsx` mantém a obrigatoriedade da seleção do jogo no combobox antes de disparar `api.rankingJogadores(gameId)`. Nenhuma chamada sem parâmetro `?jogo=` será permitida.
2. **Submissão de Jogos (RF-G01)**:
   - A tela `Enviar.tsx` preserva o formulário enxuto contendo apenas URL do GitHub, tag de versão e resumo opcional.
   - Textos orientadores esclarecem que a API cuida da extração de `game.json` e `questoes.json`.
3. **Impedimento de Decisão do Autor (RF-G15)**:
   - A tela `Moderacao.tsx` exibirá um aviso orientador de governança em destaque no painel de curadoria:
     > *"Aviso de Governança (RF-G15): Curadores que sejam autores ou colaboradores do jogo selecionado não devem registrar decisão sobre a própria submissão."*
