<!--
SYNC IMPACT REPORT
==================
- Version change: Initial adoption → 1.0.0
- List of modified principles:
  - Adotados os 8 princípios fundamentais conforme especificação do trabalho Recreio Arcade (G1 + G2).
- Added sections:
  - 1. Fronteiras e Responsabilidade
  - 2. Contrato da API
  - 3. Autenticação e Segurança
  - 4. Qualidade e Testes
  - 5. UX do Portal
  - 6. Organização do Código do Portal
  - 7. Fluxo Spec-Driven
  - 8. Governança
- Removed sections:
  - Placeholders de seções genéricas do template ([SECTION_2_NAME], [SECTION_3_NAME]) substituídos pelos princípios fundamentais específicos do projeto.
- Follow-up TODOs:
  - [NEEDS CLARIFICATION] Escopo do ranking de jogadores: confirmar alinhamento entre G1, G2 e G3 sobre suporte exclusivo a ranking por jogo (`?jogo=...`) versus demanda futura por ranking agregado global.
-->

# Recreio Arcade (G1 + G2) Constitution

## Core Principles

### 1. Fronteiras e Responsabilidade
- O diretório `api/` (Plataforma de Gestão - G1) é a autoridade máxima e dono exclusivo do banco de dados, da validação e extração de pacotes, do cálculo de rankings, do armazenamento de placares, do cômputo de votos e da autenticação de estações e curadores.
- O Portal Web (`web/` - G2) atua estritamente como cliente: NUNCA recalcula notas ou posições de ranking, NUNCA valida integridade estrutural de pacotes de jogos e NUNCA cria fontes paralelas de dados.
- O Portal Web apenas exibe dados e processa formulários de interface. Toda e qualquer comunicação HTTP DEVE transitar obrigatoriamente pelo módulo centralizador `web/src/api.ts`.
- As responsabilidades do Fliperama G3 (gerenciamento de sessão física, cache local offline e fila de sincronização de partidas) e do ecossistema G4 (jogos e SDK) residem estritamente fora deste repositório monorepo.
- Mudanças nos contratos de comunicação e esquemas de dados NUNCA DEVEM ser unilaterais: os demais grupos impactados (G3 e G4) DEVEM ser formalmente notificados antes de qualquer alteração na API.
- Rastreabilidade de referência: atende aos requisitos RF-G01 a RF-G08 e RE-xx da especificação oficial.

### 2. Contrato da API
- A submissão de jogos requer unicamente `repositorio_url`, `ref` (tag, branch ou commit) e opcionalmente `resumo` (RF-G01). Todos os metadados oficiais (título, autor, versão, controles) DEVEM ser extraídos do arquivo `game.json` contido no pacote.
- Respostas de erro da API DEVEM seguir invariavelmente o formato padronizado `{ "codigo": "...", "erro": "..." }`.
- URLs de recursos multimídia (`capa_url` e `preview_url`) DEVEM ser geradas e entregues pela API, NUNCA montadas ou inferidas dinamicamente pelo cliente Web.
- O ranking de jogadores segue o contrato estabelecido em `api/docs/ranking.md`. [NEEDS CLARIFICATION]: O contrato da API define que cada jogo possui ranking exclusivo (`GET /api/ranking/jogadores?jogo=<id>`), sem agregação global entre jogos distintos; validar se os fluxos do Portal e do G3 exigem apenas ranking específico ou se haverá necessidade de agregação unificada no futuro.
- O ranking de jogos DEVE apresentar a contagem de votos recebidos em conjunto com a nota atribuída e exibir a explicação detalhada do cálculo da nota ajustada diretamente na tela do usuário (RF-G08, RF-G14).

### 3. Autenticação e Segurança
- O sistema reconhece estritamente dois modelos de credencial: token de curador (`cur_...`) e token de estação (`est_...`). A API armazena unicamente o hash criptográfico SHA-256 de cada token, nunca sua versão em texto simples.
- O Portal Web armazena o token de curador autenticado exclusivamente em `sessionStorage`. O token NUNCA DEVE ser gravado em persistência local durável (`localStorage`), cookies, registros de log, parâmetros de URL ou versionado em commits.
- Tokens de desenvolvimento (`dev-curador`, `dev-estacao`) são de uso estritamente local gerados por script de seed e NUNCA DEVEM existir, ser aceitos ou transitar em ambiente de produção.
- Segredos operacionais, credenciais de banco e chaves de ambiente DEVEM ser excluídos do controle de versão (Git). Apenas modelos de configuração (`.env.example`) DEVEM ser versionados.
- A visualização interativa de jogos (preview) DEVE ser executada obrigatoriamente dentro de `<iframe sandbox="allow-scripts">`, sem a permissão `allow-same-origin`, garantindo o isolamento completo contra acesso ao armazenamento ou contexto do Portal.
- Qualquer dado fornecido por usuários ou originado da API (nomes, descrições, comentários, apelidos) DEVE ser renderizado estritamente como texto plano, NUNCA interpretado como código HTML executável, prevenindo vetores de XSS.

### 4. Qualidade e Testes
- A verificação de tipagem estática (`tsc --noEmit`) e a compilação de produção (`build`) de `api/` e `web/` DEVEM passar sem falhas antes de qualquer conclusão de tarefa ou entrega.
- A suíte de testes automatizados da API (Vitest) DEVE ser executada com 100% de sucesso no pipeline de integração contínua (CI), sendo mandatório criar testes automatizados para toda rota nova ou alterada.
- Fluxos críticos do Portal Web (submissão de jogo, autenticação de curador, aprovação/reprovação de versões e renderização de rankings) DEVEM conter critérios de aceitação formalizados na sintaxe Given/When/Then na especificação da funcionalidade.
- Tarefas de verificação e itens de checklist só DEVEM ser marcados como concluídos após a execução prática e validação do comando correspondente.
- Falhas e respostas de erro da API DEVEM ser apresentadas ao usuário final de maneira clara e acionável, sendo expressamente proibida a exposição de códigos técnicos internos, stack traces ou renderização de telas em branco.

### 5. UX do Portal
- O Portal Web adota a identidade estética retrô do fliperama G3: paleta em fundo escuro com alto contraste, tipografia monoespaçada e acentos visuais em cores neon (cyan, amarelo, magenta e verde).
- O sistema DEVE garantir acessibilidade e ergonomia operacional: suporte a navegação por teclado com indicador visual de foco perceptível, layout responsivo a diferentes tamanhos de tela e tratamento explícito de estados de carregamento (loading), vazio (empty) e erro em todas as telas conectadas à API.
- A interface Web DEVE ser projetada com tolerância a períodos de inicialização a frio (cold start) da API em planos gratuitos de hospedagem, fornecendo feedback visual contínuo e amigável sem passar a percepção de aplicação inoperante.

### 6. Organização do Código do Portal
- A arquitetura da interface DEVE ser modular: páginas de topo residem em `web/src/pages/` e componentes reaproveitáveis residem em `web/src/components/`, evitando concentrações monolíticas de código em um único arquivo.
- Qualquer refatoração estrutural DEVE preservar integralmente o comportamento funcional, os contratos de comunicação da API, as mensagens exibidas e as regras de negócio vigentes.

### 7. Fluxo Spec-Driven
- O ciclo de desenvolvimento DEVE seguir rigorosamente a sequência de etapas: `spec` → `clarify` → `plan` → `tasks` → `implement`. Nenhuma funcionalidade ou alteração técnica pode ser iniciada sem especificação previamente validada.
- O desenvolvimento é conduzido em escopo unitário: uma única funcionalidade por vez, com numeração cronológica e sequencial armazenada em `specs/`.
- Toda especificação DEVE referenciar expressamente os identificadores oficiais de requisitos (RF-G01 a RF-G16, RE-xx) e o épico correspondente. Demandas pertinentes a grupos externos (G3 ou G4) DEVEM ser documentadas como dependências externas e jamais absorvidas no escopo do G2.
- Qualquer ambiguidade ou indefinição funcional DEVE ser formalizada com a marcação `[NEEDS CLARIFICATION]`, sendo vedada a criação arbitrária de regras de negócio sem confirmação.
- O diagnóstico de defeitos e tarefas de correção DEVE registrar exclusivamente comportamentos empiricamente reproduzidos ou tecnicamente verificáveis.

### 8. Governança
- A presente Constituição estabelece as regras mandatórias do projeto e prevalece sobre quaisquer convenções não documentadas ou práticas locais.
- Quaisquer emendas a este documento exigem justificativa fundamentada, aprovação formal e incremento rastreável do número de versão.
- Convenções puramente operacionais (comandos específicos, detalhamento de pastas, padrões de mensagens de commit ou convenções de branch) não pertencem à Constituição e DEVEM residir exclusivamente no arquivo `AGENTS.md`.
- Regra de precedência e singularidade: cada regra do projeto possui um único local de definição canônica, evitando duplicações ou contradições entre documentações.

## Governance

O cumprimento das diretrizes estabelecidas nesta Constituição é obrigatório para todos os integrantes do projeto, revisões de código e ferramentas automatizadas de desenvolvimento.

### Procedimento de Emenda
1. **Proposta**: Submeter a alteração detalhando a justificativa técnica, impacto arquitetural e plano de migração para módulos afetados.
2. **Avaliação**: Validar a consistência em relação aos contratos entre G1, G2, G3 e G4 e requisitos oficiais do Arcade.
3. **Ratificação**: Aplicar a alteração no arquivo `.specify/memory/constitution.md` e atualizar o cabeçalho de versão e histórico de impacto.

### Política de Versionamento
A Constituição adota versionamento semântico (SemVer):
- **MAJOR (X.0.0)**: Descontinuação, alteração de premissas fundamentais ou mudanças estruturais que quebrem a governança anterior.
- **MINOR (1.X.0)**: Introdução de novos princípios, novas seções normativas ou expansão substancial de orientações existentes.
- **PATCH (1.0.X)**: Correções ortográficas, clarificações de redação e refinamentos sem alteração de escopo regulatório.

### Auditoria de Conformidade
Todas as especificações, planos de implementação e submissões de código DEVEM conter uma etapa de verificação para assegurar o alinhamento estrito a estes princípios antes de sua aceitação definitiva.

**Version**: 1.0.0 | **Ratified**: 2026-10-04 | **Last Amended**: 2026-10-04
