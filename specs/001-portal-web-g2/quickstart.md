# Quickstart & Validation Guide: Portal Web Recreio Arcade (G2)

**Feature**: `001-portal-web-g2`
**Data**: 2026-10-15
**Objetivo**: Roteiro executável para desenvolvedores e revisores validarem o Portal Web antes e depois da implementação.

---

## 1. Pré-Requisitos e Configuração do Ambiente

1. **Ambiente**:
   - Node.js 20+ instalado.
   - Dependências instaladas na raiz e nos subprojetos:
     ```bash
     npm run install:all
     ```
2. **Variáveis de Ambiente (`web/.env`)**:
   - Opcional para desenvolvimento local:
     ```env
     VITE_API_BASE_URL=http://localhost:3000/api
     ```
   - Caso não configurado, o cliente assume o fallback relativo `'/api'`, compatível com o proxy do Vite.

---

## 2. Comandos de Verificação e Build

Estes comandos DEVEM executar com 100% de sucesso sem avisos impeditivos nem erros:

```bash
# 1. Verificação de tipagem estática TypeScript no monorepo (API + Web)
npm run typecheck

# 2. Build de produção do Portal Web (Vite)
npm run build:web
```

---

## 3. Inicialização dos Serviços para Teste Ponta a Ponta

Para testar o Portal integrado com a API local e banco com seed:

```bash
# Terminal 1: Subir PostgreSQL e popular banco de desenvolvimento
npm run db:up
npm run db:migrate
npm run db:seed

# Terminal 2: Iniciar API e Portal Web simultaneamente
npm run dev
```
- **Portal Web**: `http://localhost:5173`
- **API Swagger / Documentação**: `http://localhost:3000/docs`

---

## 4. Cenários de Validação Manual dos Requisitos

### Cenário 1: Consulta ao Catálogo e Detalhes do Jogo (RF-G05, RF-G09, RF-G10, RF-G12)
1. Abra `http://localhost:5173/catalogo`.
2. Verifique se o jogo aprovado no seed (`Quiz Invaders`) aparece com capa, nota média, contagem de votos e tags de tema e nível.
3. Clique no card do jogo e navegue para `/jogos/{id}`.
4. Verifique a exibição de:
   - Resumo e descrição.
   - Histórico de versões e seus estados (`aprovado`, `substituida`, etc.).
   - Feedbacks deixados por jogadores (notas e comentários).
   - Tabela de taxa de acerto por tema.
5. Pressione `Tab` repetidamente e verifique se o foco visual (`:focus-visible`) destaca os links e botões com contorno visível.

### Cenário 2: Submissão de Jogo com Erro Acionável (RF-G01)
1. Navegue para `http://localhost:5173/enviar`.
2. Preencha uma URL inválida ou que não cumpra os requisitos (ex.: repositório sem `index.html` ou com menos de 20 questões).
3. Clique em "ENVIAR PARA CURADORIA".
4. Verifique se o formulário exibe uma mensagem de erro clara em português, sem termos técnicos como `Erro HTTP 422`.
5. Preencha uma submissão válida para observar a mensagem de confirmação.

### Cenário 3: Autenticação de Curador e Moderação Segura (RF-G04, RF-G15)
1. Navegue para `http://localhost:5173/moderacao`.
2. Insira o token de desenvolvimento: `dev-curador` e clique em "VALIDAR TOKEN".
3. Verifique que o nome do curador aparece como autenticado.
4. Abra o Developer Tools do navegador (`F12` -> Application -> Storage):
   - Confirme que o token foi gravado **apenas em `sessionStorage`** e que `localStorage` e cookies estão limpos.
5. Selecione uma versão na fila de moderação:
   - Inspecione o elemento `<iframe>` do preview jogável e comprove que o atributo é estritamente `sandbox="allow-scripts"` (sem `allow-same-origin` e sem `allow-forms`).
6. Verifique a presença do aviso de governança RF-G15 alertando que autores não devem decidir sobre suas próprias submissões.
7. Tente clicar em "REPROVAR" sem preencher o campo de justificativa e verifique o bloqueio com aviso na tela.
8. Preencha a justificativa e conclua a decisão de reprovação ou aprovação.

### Cenário 4: Ranking de Jogadores por Jogo e Anonimização (RF-G07, RF-G16)
1. Navegue para `http://localhost:5173/ranking/jogadores`.
2. Verifique o aviso inicial orientando a selecionar um jogo.
3. Selecione `Quiz Invaders` no menu suspenso.
4. Verifique a listagem dos jogadores com posição (#1, #2...), apelidos em maiúsculas, quantidade de partidas e pontuação com separador de milhar.
5. Com o token de curador autenticado na sessão, clique em "ANONIMIZAR" em um apelido.
6. Verifique se a confirmação é exibida e o ranking é recarregado sem o apelido anonimizado.

### Cenário 5: Ranking de Jogos e Explicação da Nota Ajustada (RF-G08, RF-G14)
1. Navegue para `http://localhost:5173/ranking/jogos`.
2. Verifique o bloco explicativo no topo detalhando a fórmula:
   `nota_ajustada = v/(v+m) · R + m/(v+m) · C`, com `m = 5`.
3. Verifique se a tabela lista os jogos ordenados pela nota ajustada, exibindo votos, partidas, jogadores distintos e nota simples.
