# Feature Specification: Portal Web Recreio Arcade (G2)

**Feature Branch**: `001-portal-web-g2`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "CONTEXTO O Portal Web (`web/`) já está implementado em React + TypeScript + Vite e consome a API do G1 (`api/`). Leia `web/src/App.tsx`, `web/src/api.ts`, `api/docs/*.md`, `docs/ARQUITETURA.md` e `.specify/memory/constitution.md`. Esta spec descreve O QUE o Portal faz e POR QUÊ, sem decidir stack. Não invente regra de negócio fora do que o código e `api/docs/` mostram. ESCOPO (somente G2; rastrear cada história ao requisito) - Catálogo público com capa, autores, nota média e votos (RF-G05, RF-G10, RF-G12) - Detalhe do jogo: estado, versões, comentários, notas e taxa de acerto por tema (RF-G09, RF-G10, RF-G12) - Envio de jogo por `repositorio_url` + `ref` + `resumo` opcional (RF-G01), com mensagem de erro de validação acionável - Login de curador por token e fila de moderação com preview jogável, aprovação e reprovação com justificativa (RF-G04) - Anonimização de apelido pelo curador (RF-G16) - Ranking de jogadores por jogo (RF-G07), conforme `api/docs/ranking.md` - Ranking de jogos com contagem de votos e explicação da nota ajustada na tela (RF-G08, RF-G14) REQUISITOS DE QUALIDADE A ESPECIFICAR (vêm da constitution) 1. Estados de carregamento, vazio e erro em todas as telas conectadas à API. 2. Tolerância a cold start da API, com feedback visual contínuo. 3. Navegação por teclado com foco visível, e layout responsivo. 4. Dados de usuário e da API renderizados só como texto plano. 5. Token de curador apenas em `sessionStorage`. 6. Preview em `<iframe sandbox="allow-scripts">`, sem `allow-same-origin`. 7. Erros sem código técnico, stack trace ou tela em branco. 8. Organização modular: páginas em `web/src/pages/`, componentes em `web/src/components/`, com comportamento 100% preservado. FORMATO - User stories por ator (visitante, autor, curador). - Critérios de aceitação em Given/When/Then, com os requisitos de qualidade acima como cenários. - Seção 'Estado atual vs. esperado': marque cada item como CONFORME ou DESVIO, baseado no código real. Já observei: (a) `pages/` e `components/` vazios e tudo em `App.tsx`; (b) o iframe do preview com `sandbox="allow-scripts allow-forms"`; (c) fallback `Erro HTTP ${status}` em `api.ts`. Verifique no código e procure outros desvios. - Seção 'Fora de escopo / dependências externas': G3, G4 e qualquer mudança de contrato da API. - Marque ambiguidades com [NEEDS CLARIFICATION]. Já conhecidas: ranking global vs. por jogo; divergência entre a página do curso (upload de `.zip`) e o contrato real da API (link do GitHub); RF-G15 (autor não decide a própria submissão) sem autenticação de autor. Não escreva plano técnico nem implemente nada."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consulta ao Catálogo Público e Detalhes dos Jogos (Priority: P1)

Como um **visitante** do Portal Recreio Arcade,
quero explorar a lista de jogos aprovados e consultar os detalhes completos de um jogo (incluindo capa, autores, notas, avaliações dos jogadores e desempenho por tema),
para que eu possa descobrir jogos educativos disponíveis e conhecer o histórico de avaliações da comunidade.

**Rastreabilidade de Requisitos**: RF-G05, RF-G09, RF-G10, RF-G12.

**Why this priority**: O catálogo público é a porta de entrada principal da plataforma para alunos e comunidade externa. Sem ele, a exibição de jogos aprovados e o consumo dos dados gerados pelo fliperama não são visíveis aos usuários.

**Independent Test**: Pode ser testado de forma independente acessando as rotas públicas do catálogo (`/catalogo`) e de detalhe (`/jogos/:id`) com a API respondendo com jogos mockados ou reais, verificando a renderização visual dos metadados e os estados de carregamento, vazio e erro.

**Acceptance Scenarios**:

1. **Given** que a API possui jogos com versões aprovadas,
   **When** o visitante acessa o catálogo público,
   **Then** o sistema exibe cada jogo aprovado com sua respectiva capa oficial fornecida pela API, nome, autores, tags de tema e nível, nota média formatada com uma casa decimal e quantidade total de votos.

2. **Given** que a API ainda não possui nenhum jogo no estado aprovado,
   **When** o visitante acessa o catálogo público,
   **Then** o sistema exibe um estado vazio claro indicando "NENHUM JOGO APROVADO", sem quebras de layout ou telas em branco.

3. **Given** que a chamada à API para carregar o catálogo está em andamento,
   **When** a página do catálogo é acessada,
   **Then** o sistema exibe um indicador explícito de carregamento informando que a API está sendo consultada.

4. **Given** que a API está em período de inicialização a frio (*cold start*) ou demorando para responder,
   **When** o visitante aguarda o carregamento do catálogo ou dos detalhes,
   **Then** o sistema mantém feedback visual contínuo e amigável sem passar a percepção de aplicação travada ou inoperante.

5. **Given** que a API retorna uma falha de comunicação ou erro HTTP ao consultar o catálogo,
   **When** o visitante visualiza a tela,
   **Then** o sistema exibe uma mensagem amigável e acionável sem expor códigos técnicos, stack traces ou tela em branco.

6. **Given** que um visitante clica em um jogo no catálogo,
   **When** a página de detalhes do jogo é carregada,
   **Then** o sistema exibe o nome, resumo, descrição completa, controles, mecânica, clássico de referência, capa oficial, autores, nota média, total de votos, histórico de versões com seus respectivos estados, comentários e notas deixados por jogadores, e a taxa de acerto percentual por tema.

7. **Given** que um jogo não possui capa cadastrada,
   **When** o visitante visualiza seu card no catálogo ou na página de detalhes,
   **Then** o sistema exibe um placeholder visual retro padronizado (ícone temático de arcade), mantendo a integridade estética.

8. **Given** que o visitante navega usando apenas o teclado (Tab / Shift+Tab / Enter),
   **When** percorre os elementos do catálogo e da tela de detalhes,
   **Then** todos os links, botões e cards interativos apresentam indicador visual de foco nítido e destacado.

9. **Given** que descrições, comentários de jogadores ou nomes contenham caracteres especiais ou sequências semelhantes a tags HTML (potencial XSS),
   **When** essas informações são renderizadas na tela de detalhes ou no catálogo,
   **Then** o sistema renderiza todo o conteúdo estritamente como texto plano, sem interpretação de script ou injeção de marcação HTML.

---

### User Story 2 - Consulta aos Rankings Públicos (Jogadores e Jogos) (Priority: P2)

Como um **visitante** do Portal Recreio Arcade,
quero consultar o ranking de pontuação dos jogadores por jogo e o ranking geral dos jogos avaliados pela comunidade com a explicação da nota ajustada,
para acompanhar os recordes dos fliperamas e compreender a reputação de cada jogo com base na fórmula estatística adotada.

**Rastreabilidade de Requisitos**: RF-G07, RF-G08, RF-G14.

**Why this priority**: O sistema de ranking e gamificação é o elo central entre o fliperama físico e a comunidade. A transparência na nota ajustada garante a credibilidade do julgamento dos jogos.

**Independent Test**: Pode ser testado selecionando um jogo existente para carregar a tabela de jogadores e navegando para a tela de ranking de jogos, verificando se a fórmula e os dados de votos, partidas e nota ajustada são exibidos.

**Acceptance Scenarios**:

1. **Given** que o visitante acessa a tela de ranking de jogadores,
   **When** nenhum jogo foi selecionado no seletor,
   **Then** o sistema exibe um aviso orientando o usuário a selecionar um jogo para consultar o ranking correspondente.

2. **Given** que o visitante seleciona um jogo com pontuações registradas,
   **When** os dados são retornados pela rota `GET /api/ranking/jogadores?jogo=<id>`,
   **Then** o sistema exibe os jogadores ordenados por posição (#1, #2...), apresentando apelido em maiúsculas, quantidade de partidas jogadas e a maior pontuação alcançada com separador de milhar.

3. **Given** que o visitante seleciona um jogo sem pontuações válidas (ou apenas partidas anônimas `ANON`),
   **When** o retorno for uma lista vazia,
   **Then** o sistema exibe a mensagem de estado vazio: "NENHUMA PARTIDA NO RANKING DESTE JOGO."

4. **Given** que o visitante acessa a tela de ranking de jogos,
   **When** a página é renderizada,
   **Then** o sistema exibe a lista de jogos aprovados ordenados por `nota_ajustada`, apresentando a posição, o nome do jogo, quantidade de votos recebidos, número de partidas, total de jogadores distintos, média simples e a nota ajustada calculada pela API.

5. **Given** que o visitante visualiza o ranking de jogos,
   **When** analisa o cabeçalho da página,
   **Then** o sistema exibe explicitamente a explicação do cálculo da nota ajustada pela média ponderada (`nota_ajustada = v/(v+m) · R + m/(v+m) · C`, com `m = 5`), esclarecendo como o algoritmo equilibra notas médias com volume de votos.

---

### User Story 3 - Submissão de Jogos por Repositório de Código (Priority: P3)

Como um **autor** ou desenvolvedor de jogos educativos,
quero submeter meu jogo informando a URL do meu repositório público no GitHub, uma tag/ref de versão e opcionalmente um resumo,
para que minha versão entre na fila de avaliação da curadoria e eu receba mensagens de validação claras caso algo precise ser corrigido.

**Rastreabilidade de Requisitos**: RF-G01, RF-G09.

**Why this priority**: A submissão é o mecanismo pelo qual novos conteúdos educacionais e correções de versões entram no ecossistema do Recreio Arcade.

**Independent Test**: Pode ser testado preenchendo o formulário de envio com URLs válidas/inválidas e tags de versão, observando se a API recebe exatamente `{ repositorio_url, ref, resumo }` e se erros de validação retornados (ex.: falta de `index.html`, manifesto inválido, poucas questões) são repassados ao usuário como instruções claras.

**Acceptance Scenarios**:

1. **Given** que o autor preenche uma URL válida de repositório GitHub público (ex.: `https://github.com/usuario/jogo-exemplo`), uma tag válida (ex.: `v1.0.0`) e um resumo opcional de até 300 caracteres,
   **When** clica em "ENVIAR PARA CURADORIA",
   **Then** o sistema envia a requisição para a API, desabilita o botão exibindo "ENVIANDO...", e ao obter sucesso limpa o formulário e apresenta mensagem de sucesso confirmando que a versão entrou na fila de curadoria.

2. **Given** que o autor submete um repositório que não cumpre as regras de validação da API (ex.: menos de 20 questões, falta de fonte em alguma questão, arquivo `game.json` ausente ou pacote corrompido),
   **When** a API responde com código HTTP de erro (ex.: 422 Unprocessable Entity) e mensagem descritiva no payload `{ "codigo": "...", "erro": "..." }`,
   **Then** o sistema exibe a mensagem de erro textual de forma acionável (explicando exatamente qual questão está sem fonte ou qual arquivo está ausente), sem exibir mensagens genéricas nem código técnico.

3. **Given** que o autor submete uma tag de versão que já foi submetida e não foi reprovada (conflito 409),
   **When** a resposta da API é recebida,
   **Then** o sistema exibe a orientação de que aquela versão já foi submetida, instruindo o autor a incrementar a versão no manifesto ou aguardar a decisão.

4. **Given** que o autor tenta submeter sem preencher o repositório ou a ref da versão,
   **When** aciona o envio,
   **Then** a interface impede o envio e alerta sobre os campos obrigatórios via validação nativa acessível.

---

### User Story 4 - Autenticação de Curador e Moderação de Versões com Preview (Priority: P4)

Como um **curador** da plataforma Recreio Arcade,
quero me autenticar fornecendo meu token de acesso `cur_...`, visualizar a fila de jogos pendentes de moderação, jogar o preview interativo de cada submissão em ambiente seguro e emitir a decisão de aprovação ou reprovação com justificativa obrigatória,
para garantir a qualidade técnica, pedagógica e de segurança dos jogos antes de disponibilizá-los aos fliperamas.

**Rastreabilidade de Requisitos**: RF-G04, RF-G09.

**Why this priority**: A curadoria é o gatekeeper de segurança e conformidade do arcade. Sem curadoria, nenhum jogo atinge o estado "aprovado" nem é distribuído para o fliperama.

**Independent Test**: Pode ser testado autenticando com um token de curador válido, selecionando um jogo pendente na lista, verificando se o iframe de preview é montado com sandbox restrito (`allow-scripts` apenas) e aprovando ou reprovando com justificativa.

**Acceptance Scenarios**:

1. **Given** que o curador insere um token com formato válido e clica em "VALIDAR TOKEN",
   **When** a API valida o token com sucesso em `GET /api/curadores/eu`,
   **Then** o sistema armazena o token exclusivamente no `sessionStorage`, exibe o nome do curador autenticado na tela, habilita os controles de decisão e não grava o token em nenhum momento em `localStorage`, cookies ou URL.

2. **Given** que o curador informa um token inexistente ou inválido,
   **When** a validação falha,
   **Then** o sistema remove qualquer resquício de credencial do `sessionStorage`, limpa o nome do curador e exibe mensagem de erro clara informando a rejeição do token.

3. **Given** que há jogos com versões no estado `submetido`,
   **When** o curador acessa a fila de moderação,
   **Then** o sistema lista as versões pendentes informando o nome do jogo, versão e autores.

4. **Given** que o curador seleciona uma versão pendente da lista,
   **When** o jogo possui `preview_url` fornecida pela API,
   **Then** o sistema renderiza o preview jogável dentro de um elemento `<iframe>` com atributo `sandbox="allow-scripts"` (estritamente sem `allow-same-origin` e sem `allow-forms`), garantindo o isolamento da sessão do Portal.

5. **Given** que o curador avalia a versão e decide aprová-la,
   **When** clica em "APROVAR",
   **Then** o sistema envia a decisão de aprovação para `POST /api/versoes/{versaoId}/decisao` com a credencial de curador, exibe a confirmação na tela, limpa a seleção e atualiza a fila de pendências.

6. **Given** que o curador decide reprovar uma versão,
   **When** clica em "REPROVAR" sem preencher o campo de justificativa,
   **Then** o sistema impede a requisição e exibe um aviso em destaque informando que a reprovação exige justificativa obrigatória.

7. **Given** que o curador preenche a justificativa pedagógica/técnica e clica em "REPROVAR",
   **When** a API confirma o registro da reprovação,
   **Then** a submissão transiciona para o estado `reprovado`, o histórico registra o motivo, e a versão é removida da fila de pendentes.

8. **Given** que o curador clica no botão "SAIR",
   **When** encerra sua sessão,
   **Then** o token é expurgado de `sessionStorage`, os botões de decisão voltam ao estado desabilitado e a interface retorna ao estado desautenticado.

---

### User Story 5 - Moderação e Anonimização de Apelidos pelo Curador (Priority: P5)

Como um **curador** da plataforma Recreio Arcade,
quero poder anonimizar apelidos inadequados, ofensivos ou a pedido de privacidade do próprio jogador diretamente na listagem de pontuações,
para manter o ambiente do fliperama escolar seguro e em conformidade com as diretrizes de privacidade sem descartar os pontos válidos dos jogos.

**Rastreabilidade de Requisitos**: RF-G16.

**Why this priority**: A anonimização garante a proteção de dados dos alunos e a mediação de termos impróprios nos fliperamas.

**Independent Test**: Pode ser testado autenticando como curador, navegando ao ranking de um jogo com partidas registradas, acionando a anonimização de um jogador específico e confirmando que a API substitui o apelido por `ANON` e remove o jogador do ranking de jogadores.

**Acceptance Scenarios**:

1. **Given** que um curador autenticado identifica um apelido no ranking de jogadores,
   **When** aciona a ação de anonimização para aquele apelido,
   **Then** o sistema envia requisição autenticada para `POST /api/ranking/jogadores/anonimizar` com o apelido e o identificador do jogo selecionado.

2. **Given** que a API conclui a anonimização com sucesso,
   **When** o retorno `{ ok: true, apelido_anterior: "...", apelido_novo: "ANON" }` é processado,
   **Then** o sistema exibe mensagem de confirmação da anonimização e recarrega imediatamente o ranking do jogo, onde o apelido original não é mais exibido.

3. **Given** que um visitante não autenticado como curador tenta acionar a ação de anonimização,
   **When** clica na opção correspondente,
   **Then** o sistema bloqueia o envio e alerta que a anonimização é uma prerrogativa restrita a curadores autenticados por token.

---

### Edge Cases

- **Cold Start Prolongado da API**: Se a API demorar até 60 segundos para responder à primeira requisição em ambientes de hospedagem gratuita, o Portal não deve exibir tela em branco nem mensagem imediata de erro fatal, mantendo o indicador visual de consulta em andamento e atualizando o status do serviço.
- **Falha de Rede ou Queda da API durante Submissão/Decisão**: Caso a conexão caia durante o envio de um formulário ou decisão de curadoria, o usuário deve receber uma mensagem textual informando a indisponibilidade momentânea, permitindo tentar novamente sem perda dos dados digitados no formulário.
- **Jogo sem Capa ou sem Preview**: Caso a submissão não possua `capa_url` ou a API ainda não tenha gerado `preview_url`, o Portal deve exibir placeholders visuais padronizados com link alternativo para o repositório, sem quebras de layout.
- **Tentativa de Aprovação Simultânea**: Se dois curadores tentarem decidir a mesma versão ao mesmo tempo e o segundo receber conflito (409 `VERSAO_JA_DECIDIDA`), o sistema deve exibir mensagem explicativa de que a versão já foi decidida e recarregar a fila.
- **Apelido com Caracteres Especiais ou XSS**: Apelidos e comentários maliciosos vindos de submissões antigas ou testes devem ser tratados como texto simples, impedindo qualquer injeção no DOM.
- **Decisão do Próprio Autor (RF-G15)**: Conforme diretriz de governança, o Portal exibe aviso orientador na interface de curadoria reforçando que autores não devem julgar nem decidir sobre suas próprias submissões, mantendo a integridade do processo via colegiado de curadoria humana.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE fornecer um catálogo público contendo todos os jogos com versão no estado `aprovado`, exibindo título, capa, autores, nota média e contagem de avaliações (Rastreamento: RF-G05, RF-G10, RF-G12).
- **FR-002**: O sistema DEVE disponibilizar uma página de detalhes para cada jogo, exibindo metadados completos, lista de versões históricas com seus respectivos estados, comentários e avaliações recebidas, e taxa percentual de acertos agrupada por tema (Rastreamento: RF-G09, RF-G10, RF-G12).
- **FR-003**: O sistema DEVE permitir a submissão de jogos mediante formulário contendo unicamente `repositorio_url` (URL pública do GitHub), `ref` (tag/branch/commit da versão) e opcionalmente `resumo` (máximo 300 caracteres), repassando as validações estruturais integralmente para a API (Rastreamento: RF-G01).
- **FR-004**: O sistema DEVE apresentar mensagens de erro de validação de submissão de forma acionável e em linguagem compreensível pelo autor com base nas respostas da API (ex.: ausência de `index.html`, manifesto inválido, questões insuficientes ou ausência de fontes) (Rastreamento: RF-G01, Princípio 4 da Constitution).
- **FR-005**: O sistema DEVE fornecer mecanismo de autenticação para curadores mediante fornecimento de token de acesso com prefixo `cur_...`, validando a credencial via rota `GET /api/curadores/eu` (Rastreamento: RF-G04).
- **FR-006**: O sistema DEVE armazenar o token de curador validado estritamente na memória de sessão do navegador (`sessionStorage`), sendo expressamente vedado o uso de `localStorage`, cookies duráveis, parâmetros de URL ou versionamento em código (Rastreamento: RF-G04, Princípio 3 da Constitution).
- **FR-007**: O sistema DEVE listar a fila de versões pendentes de moderação (estado `submetido`) para análise do curador autenticado (Rastreamento: RF-G04).
- **FR-008**: O sistema DEVE exibir o preview jogável da versão selecionada dentro de um container isolado `<iframe sandbox="allow-scripts">`, sem permissão `allow-same-origin` e sem `allow-forms`, prevenindo que scripts do jogo acessem dados ou contexto do Portal (Rastreamento: RF-G04, Princípio 3 da Constitution).
- **FR-009**: O sistema DEVE permitir que o curador autenticado aprove ou reprove a versão selecionada, exigindo justificativa obrigatória em caso de reprovação e enviando a decisão para a rota `POST /api/versoes/{versaoId}/decisao` (Rastreamento: RF-G04).
- **FR-010**: O sistema DEVE permitir que o curador autenticado solicite a anonimização de um apelido de jogador em um jogo específico ou em todos os jogos, enviando a requisição para `POST /api/ranking/jogadores/anonimizar` e atualizando a interface imediatamente (Rastreamento: RF-G16).
- **FR-011**: O sistema DEVE exibir o ranking de pontuação de jogadores filtrado obrigatoriamente por jogo (`GET /api/ranking/jogadores?jogo=<id>`), apresentando posição, apelido, pontuação e número de partidas (Rastreamento: RF-G07).
- **FR-012**: O sistema DEVE suportar exclusivamente a consulta de ranking de pontuação de jogadores por jogo (`GET /api/ranking/jogadores?jogo=<id>`), exigindo a seleção obrigatória de um jogo para exibição das pontuações e sem implementação de visualização agregada global, em estrita conformidade com o contrato da API G1 e a decisão de projeto de 23/09 (Rastreamento: RF-G07).
- **FR-013**: O sistema DEVE manter unicamente o contrato oficial de submissão da API G1 baseado em `repositorio_url`, `ref` e `resumo` opcional, instruindo claramente o autor na tela de que o pacote do jogo (zip, manifesto `game.json` e questões) é baixado e validado de forma automática diretamente a partir da tag pública do GitHub pela API G1 (Rastreamento: RF-G01).
- **FR-014**: O sistema DEVE implementar o requisito RF-G15 na interface de moderação mediante aviso declaratório e orientador em destaque, instruindo expressamente os curadores de que autores não devem avaliar nem emitir parecer sobre suas próprias submissões, confiando a conformidade ética à governança humana do colegiado de curadores (Rastreamento: RF-G15).
- **FR-015**: O sistema DEVE exibir o ranking público de jogos ordenado pela nota ajustada calculada pela API, apresentando a contagem de votos recebidos, nota média simples, partidas, jogadores distintos e a explicação visual da fórmula da média ponderada na própria tela (Rastreamento: RF-G08, RF-G14).
- **FR-016**: O sistema DEVE implementar explicitamente os estados de carregamento (*loading*), vazio (*empty*) e erro (*error*) em todas as visualizações integradas à API (Rastreamento: Princípio 5 da Constitution).
- **FR-017**: O sistema DEVE fornecer tolerância a *cold start* da API em provedores de nuvem gratuitos, provendo feedback contínuo sem induzir o usuário a crer que a aplicação falhou (Rastreamento: Princípio 5 da Constitution).
- **FR-018**: O sistema DEVE assegurar navegabilidade integral por teclado com indicadores visíveis de foco (*focus visible*) e garantir responsividade em telas desktop, tablets e smartphones (Rastreamento: Princípio 5 da Constitution).
- **FR-019**: O sistema DEVE renderizar todos os dados providos por usuários e pela API estritamente como texto plano, sem interpretação de marcação HTML ou execução de scripts embutidos (Rastreamento: Princípio 3 da Constitution).
- **FR-020**: O sistema DEVE tratar falhas de comunicação sem exibir códigos técnicos brutos (como `Erro HTTP 500`), stack traces ou telas em branco (Rastreamento: Princípio 4 da Constitution).
- **FR-021**: A arquitetura do código da interface DEVE ser modular, mantendo páginas isoladas sob `web/src/pages/` e componentes visuais e de interação sob `web/src/components/`, preservando 100% do comportamento funcional existente (Rastreamento: Princípio 6 da Constitution).

---

### Key Entities

- **Jogo (Game)**: Representa o título educativo cadastrado no catálogo. Atributos conceituais: identificador único (`id`), nome, descrição, resumo, mecânica, clássico de referência, tema pedagógico, nível de escolaridade, autores, controles, versão ativa aprovada, nota média, total de votos, quantidade de partidas jogadas e URL da imagem de capa.
- **Versão do Jogo (GameVersion)**: Representa uma iteração de código e conteúdo submetida para um jogo. Atributos conceituais: identificador da versão (`versao_id`), número semântico (`versao`), estado atual (`submetido`, `aprovado`, `reprovado`, `substituida`), referência de origem (`ref`), data de submissão, data de decisão, curador responsável pela decisão e justificativa técnica/pedagógica.
- **Feedback e Avaliação (Feedback)**: Registro de opinião e nota fornecido pelo jogador ao final de uma sessão no fliperama. Atributos conceituais: identificador da partida, apelido do jogador, nota atribuída (escala 1 a 5), comentário opcional e data do registro.
- **Taxa de Acerto por Tema (AccuracyByTheme)**: Métrica agregada de desempenho cognitivo dos jogadores em determinado jogo. Atributos conceituais: nome do tema, total de respostas corretas, total de erros e percentual consolidado de acertos.
- **Ranking de Jogador (PlayerRank)**: Posição competitiva alcançada por um jogador em determinado jogo. Atributos conceituais: posição ordinal, apelido do jogador em caixa alta, pontuação máxima obtida e total de partidas disputadas.
- **Ranking de Jogo (GameRank)**: Classificação consolidada de qualidade dos jogos. Atributos conceituais: posição ordinal, identificador e nome do jogo, média simples de notas, total de votos computados, partidas realizadas, jogadores distintos e nota ajustada balanceada.
- **Sessão de Curador (CuratorSession)**: Contexto de autorização temporário em memória de sessão do navegador. Atributos conceituais: identificador do curador, nome do curador e token de autorização Bearer (`cur_...`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O visitante consegue localizar um jogo aprovado e acessar sua página de detalhes em menos de 3 cliques a partir da página inicial.
- **SC-002**: 100% das páginas conectadas à API exibem estados visuais claros para carregamento, retorno vazio e mensagem amigável de erro em caso de indisponibilidade.
- **SC-003**: 100% das tentativas de submissão com dados inválidos retornam mensagens de orientação compreensíveis e acionáveis, eliminando mensagens com códigos técnicos brutos.
- **SC-004**: O curador autenticado consegue avaliar o preview jogável e registrar a decisão de aprovação ou reprovação em menos de 60 segundos após o carregamento da submissão.
- **SC-005**: 0% de credenciais de curador persistem em armazenamento local de longa duração (`localStorage`), cookies duráveis ou registros de log.
- **SC-006**: 100% dos dados textuais originados de usuários ou da API são renderizados com escape estrito contra vetores de Cross-Site Scripting (XSS).
- **SC-007**: Toda a interface é navegável integralmente via teclado (Tab, Shift+Tab, Enter e Espaço), com indicadores de foco visual destacados com contraste adequado.
- **SC-008**: O layout da aplicação mantém legibilidade, usabilidade e integridade visual retro nas faixas de resolução desde dispositivos móveis (a partir de 320px de largura) até telas desktop ultra-wide (1400px+).

---

## Assumptions

- O Portal Web consome exclusivamente os endpoints definidos na especificação da API G1 descrita em `api/docs/*.md`.
- A API do G1 é a única responsável pelas regras matemáticas de ranking, cálculos de média ponderada, extração de pacotes e autenticação criptográfica de tokens.
- O Portal Web não implementa base de dados local própria nem armazena credenciais em backend auxiliar, atuando estritamente como Single Page Application (SPA).
- A identificação visual do Portal adota a identidade retrô do fliperama G3, priorizando contraste escuro, tipografia monoespaçada e realces em cores neon.

---

## Estado Atual vs. Esperado

Esta seção audita o código real implementado em `web/src/` contra os requisitos desta especificação e os princípios da Constituição do projeto.

| Item Avaliado | Requisito Esperado | Implementação Atual no Código | Situação |
| :--- | :--- | :--- | :--- |
| **Organização do Código** | Código modular com páginas em `web/src/pages/` e componentes em `web/src/components/` (Princípio 6) | Arquivos em `web/src/pages/*.tsx` e `web/src/components/*.tsx` estão com 0 bytes; todas as telas e componentes residem monoliticamente em `web/src/App.tsx` (961 linhas) | **DESVIO** |
| **Isolamento do Preview** | Preview de jogo em `<iframe sandbox="allow-scripts">` sem `allow-same-origin` e sem `allow-forms` (Princípio 3, FR-008) | `web/src/App.tsx` (linha 716) renderiza `<iframe sandbox="allow-scripts allow-forms" ... />`, concedendo indevidamente permissão de formulários | **DESVIO** |
| **Tratamento de Erros da API** | Mensagens claras e amigáveis, expressamente proibida a exposição de códigos técnicos como `Erro HTTP <status>` (Princípio 4, FR-020) | `web/src/api.ts` (linha 182) contém fallback `const message = errorBody?.erro \|\| \`Erro HTTP ${response.status}\``, expondo status HTTP bruto quando a resposta não é JSON padronizado | **DESVIO** |
| **Tolerância a Cold Start** | Tolerância explícita a cold start com feedback contínuo amigável (Princípio 5, FR-017) | `web/src/App.tsx` faz apenas chamada pontual a `api.health()`. Se falhar por cold start, marca imediatamente `API OFFLINE` (ponto rosa) sem retentativa nem mensagem explicativa na tela | **DESVIO** |
| **Foco Visível no Teclado** | Indicador de foco visualmente destacado em todos os elementos interativos para acessibilidade (Princípio 5, FR-018) | `web/src/styles.css` estiliza foco apenas para `input`, `textarea` e `select`. Botões (`.arcade-button`, `.queue-item`), cards (`.game-card`) e links não possuem `:focus-visible` explícito | **DESVIO** |
| **Persistência de Sessão do Curador** | Token exclusivamente em `sessionStorage` (Princípio 3, FR-006) | `web/src/api.ts` utiliza `sessionStorage.getItem/setItem` com a chave `recreio-arcade-curador-token` | **CONFORME** |
| **Prevenção de XSS** | Dados de usuário e da API renderizados estritamente como texto plano (Princípio 3, FR-019) | Todos os valores são interpolados como expressões de texto do React (`{game.nome}`, `{feedback.comentario}`), sem uso de `dangerouslySetInnerHTML` | **CONFORME** |
| **Catálogo Público de Jogos** | Exibição de capas, autores, notas e contagem de votos (RF-G05, RF-G10, RF-G12) | Implementado funcionalmente na função `Catalogo` de `App.tsx` | **CONFORME** |
| **Detalhes do Jogo** | Exibição de versões, comentários, notas e taxa de acerto por tema (RF-G09, RF-G10, RF-G12) | Implementado funcionalmente na função `Detalhes` de `App.tsx` | **CONFORME** |
| **Formulário de Submissão** | Envio exclusivo de `repositorio_url`, `ref` e `resumo` opcional (RF-G01) | Implementado funcionalmente na função `Enviar` de `App.tsx` e `api.submeterJogo` | **CONFORME** |
| **Ranking de Jogadores por Jogo** | Consulta restrita por jogo via `?jogo=<id>` (RF-G07) | Implementado na função `RankingJogadores` de `App.tsx`, exigindo seleção prévia de jogo | **CONFORME** |
| **Ranking de Jogos com Fórmula** | Exibição da contagem de votos e explicação da fórmula ponderada (RF-G08, RF-G14) | Implementado na função `RankingJogos` de `App.tsx` com bloco explicativo da nota ajustada | **CONFORME** |
| **Moderação com Justificativa** | Aprovação e reprovação com justificativa obrigatória na reprovação (RF-G04) | Implementado na função `Moderacao` de `App.tsx` com validação de preenchimento para reprovação | **CONFORME** |
| **Anonimização por Curador** | Chamada autenticada para trocar apelido por `ANON` (RF-G16) | Implementado via rota `/ranking/jogadores/anonimizar` com token de curador | **CONFORME** |

---

## Fora de Escopo / Dependências Externas

### Fora de Escopo (Grupo G2 - Portal Web)
- **Fliperama Físico (G3)**: Gerenciamento da cabine de fliperama, captura física de moedas/fichas, joystick arcade, execução local dos jogos e sincronização offline de partidas.
- **Desenvolvimento e SDK dos Jogos (G4)**: Criação de mecânicas de jogos, arquivos `index.html`, formulação de bancos de questões em `questoes.json` e envio de mensagens `postMessage` (`PLACAR`).
- **Lógica de Backend e Banco de Dados (G1)**: Qualquer recálculo autônomo de notas ajustadas, descompactação de repositórios no cliente, validação estrutural de integridade de arquivos zip ou alterações unilaterais nos contratos de rotas da API.
- **Alterações de Contrato da API**: Qualquer modificação nos esquemas de resposta, endpoints ou parâmetros descritos em `api/docs/*.md`.

### Dependências Externas
- **Disponibilidade da API do G1**: O Portal depende dos serviços HTTP e CORS providos pela API em execução (localmente ou no Render).
- **CDN / Provedor de Mídia**: Disponibilidade das rotas de entrega de capas (`capa_url`) e de arquivos de preview (`preview_url`) providos pela API.
- **API do GitHub**: Disponibilidade e limites de taxa da API pública do GitHub para resolução e download de tags durante o processamento de submissões pelo G1.
