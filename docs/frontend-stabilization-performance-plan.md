# Plano de Estabilizacao e Desempenho — Frontend Clinic

Status: planejado, nao iniciado
Data de criacao: 2026-09-21
Escopo: `frontend-clinic`

## Objetivo

Reduzir piscadas, remontagens desnecessarias, carregamentos repetidos e
transicoes instaveis nas paginas do Clinic, mantendo os contratos atuais de
login, tenant, Agenda e plano de tratamento.

A regra desta fase e medir antes de otimizar. Nenhuma mudanca de performance
deve ser aceita apenas porque parece mais rapida: cada alteracao precisa
preservar o fluxo e ser comparada com um baseline.

## Sintomas que entram no escopo

- tela ou shell desaparecendo durante carregamentos curtos;
- lista que pisca ao trocar filtro, cliente, tenant ou rota;
- modal que fecha e reabre durante uma atualizacao;
- formulario que perde foco, draft ou scroll;
- chamadas duplicadas ao backend;
- efeitos que recarregam dados por mudancas de referencia, nao de identidade;
- layout shift causado por conteudo que aparece sem espaco reservado;
- primeira abertura lenta de Home, Agenda, cliente e plano de tratamento.

## Fora do escopo inicial

- novo roteamento ou reorganizacao ampla de pastas;
- troca de biblioteca visual;
- reescrita geral da Home ou da Agenda;
- alteracoes de contrato do backend;
- micro-otimizacoes sem evidencia no Performance panel.

A Fase 5 de roteamento permanece separada. Este plano pode observar o custo das
rotas atuais, mas nao vai redesenha-las.

## Cenarios de medicao

Usar uma janela anonima ou perfil local controlado, com dados de teste
repetiveis. Registrar tenant e especialidade, sem incluir senha, token ou dados
pessoais nas evidencias.

### Cenario A — entrada no Clinic

1. Abrir o frontend Clinic com o tenant definido.
2. Fazer login.
3. Medir ate a Home estar interativa e sem mudanca visual inesperada.
4. Recarregar uma vez e repetir para separar cold load de warm load.

### Cenario B — cliente e retorno

1. Abrir a lista de clientes.
2. Buscar um cliente.
3. Abrir o detalhe.
4. Voltar para a lista.
5. Repetir a busca e verificar se o estado visual e a posicao da lista sao preservados.

### Cenario C — Agenda

1. Abrir Agenda pela Home.
2. Alternar dia, semana e mes.
3. Abrir e fechar detalhes de um compromisso.
4. Abrir QuickSchedule, cancelar e abrir novamente.
5. Confirmar ausencia de scroll lock, modal duplicado ou tela vazia.

### Cenario D — plano de tratamento

1. Abrir um cliente com plano existente.
2. Alternar entre lista e workspace do plano.
3. Alterar notas e condicao de pagamento.
4. Aguardar o autosave.
5. Recarregar e confirmar persistencia sem pisca ou duplicacao de requisicoes.

### Cenario E — tenant e sessao

1. Entrar no tenant Clinic de Podologia.
2. Sair e entrar no tenant Clinic de Odontologia, quando disponivel.
3. Confirmar que capabilities, dados e shell visual nao ficam misturados.
4. Repetir com uma sessao sem cache quando o cenario exigir cold load.

## Baseline no Chrome DevTools

Para cada cenario, abrir DevTools e usar:

### Performance

1. Abrir `Performance`.
2. Ativar Screenshots e, quando necessario, Web Vitals.
3. Limpar a gravacao anterior.
4. Gravar a interacao completa, iniciando um pouco antes da acao.
5. Parar apos a tela estabilizar.
6. Registrar na tabela de evidencia:
   - duracao total da interacao;
   - quantidade de long tasks visiveis;
   - frames com queda ou tela em branco;
   - eventos de recalculate style/layout relevantes;
   - momento em que a tela ficou utilizavel;
   - screenshots que mostrem a piscada.

### Network

Durante a mesma reproducao, verificar:

- requests duplicadas para a mesma URL;
- requests canceladas ao trocar de tela;
- waterfalls causados por chamadas sequenciais evitaveis;
- respostas muito maiores que o necessario;
- chamadas disparadas novamente sem mudanca de identidade.

Usar throttling apenas para reproduzir um problema. Para comparar numeros,
manter o mesmo perfil de CPU, rede, viewport e estado de cache.

### React DevTools Profiler

Quando o problema parecer renderizacao:

- gravar a mesma interacao no Profiler;
- identificar componentes com render repetido;
- observar commits longos;
- verificar se uma prop, callback ou objeto novo esta invalidando uma subarvore;
- confirmar primeiro se o render e realmente caro antes de adicionar memoizacao.

## Hipoteses prioritarias a testar

### 1. Loading global substituindo a tela inteira

Sinal: uma busca curta desmonta a pagina e mostra `Carregando...` antes de
reconstruir a tela.

Acao possivel: separar carregamento inicial de refresh em background e manter o
conteudo anterior enquanto a atualizacao esta em andamento.

Cuidado: nao esconder erro nem exibir dados de outro cliente ou tenant.

### 2. Efeitos que recarregam por referencias instaveis

Sinal: a aba Network mostra a mesma chamada apos uma mudanca visual simples ou
apos cada render do shell.

Acao possivel: revisar dependencias de `useEffect`, identidade de callbacks,
listeners do event bus e sincronizacao com query string.

Cuidado: usar `useCallback` ou memoizacao apenas quando a medicao mostrar que a
identidade instavel causa o efeito ou render extra.

### 3. Remontagem involuntaria por `key` ou troca de host

Sinal: formulario perde foco, scroll, draft ou estado local ao atualizar dados.

Acao possivel: revisar `key` de paginas/workspaces e separar troca de entidade
de refresh da mesma entidade.

Cuidado: a troca real de cliente ou plano deve continuar limpando estado
sensivel do cliente anterior.

### 4. Modal e scroll global

Sinal: a tela pisca ao fechar/abrir modal, ou o body permanece travado.

Acao possivel: medir a sequencia de commits e eventos de scroll antes de tocar
em `Modal.tsx`, `Home.tsx` ou nos hosts globais da Agenda.

Cuidado: `Modal.tsx` e infraestrutura sensivel; qualquer ajuste precisa de
regressao manual em desktop e iOS/WebKit.

### 5. Layout sem dimensao reservada

Sinal: botoes, listas ou cards mudam de posicao quando dados chegam.

Acao possivel: reservar dimensoes para skeletons, headers, listas vazias,
mensagens e controles que alternam estado.

Cuidado: nao usar skeleton que imite uma estrutura diferente da tela final.

## Ordem de execucao

### Fase 1 — Inventario e baseline

- escolher um cenario representativo de Home, Agenda, cliente e plano;
- registrar gravacoes Performance e Network;
- anotar sintomas observaveis e numeros comparaveis;
- separar problema de rede, render, layout e transicao de estado.

Saida: tabela de baseline e lista priorizada por impacto.

### Fase 2 — Estabilidade visual de carregamento

- revisar estados inicial, refresh, vazio e erro;
- impedir desmontagem desnecessaria durante refresh;
- manter headers e controles estaveis;
- corrigir layout shift mais evidente.

Saida: nenhuma piscada nos cenarios corrigidos e nenhuma perda de dados locais.

### Fase 3 — Controle de efeitos e requisicoes

- localizar requests duplicadas;
- revisar dependencias de efeitos nos owners das paginas;
- centralizar refresh quando duas camadas atualizam o mesmo recurso;
- cancelar ou ignorar respostas obsoletas quando a entidade mudar.

Saida: cada interacao deve ter uma explicacao clara para cada request.

### Fase 4 — Renderizacao e remounts

- usar Profiler para localizar commits caros;
- corrigir troca indevida de `key` e callbacks instaveis somente onde medido;
- preservar foco, scroll e draft;
- evitar memoizacao ampla sem beneficio comprovado.

Saida: menos commits relevantes sem aumentar complexidade desnecessaria.

### Fase 5 — Validacao de regressao

- repetir os cinco cenarios com cold e warm load;
- testar tenant Podologia e Odontologia;
- testar desktop e viewport mobile;
- revisar Agenda, modais, retorno de pendencias e autosave do plano;
- executar typecheck, lint, testes e build.

Saida: evidencia comparavel antes/depois e lista de riscos residuais.

## Criterios de aceite

- nenhum shell fica em branco durante refresh normal;
- nenhum formulario perde foco, draft ou scroll sem troca real de entidade;
- nenhuma request duplicada permanece sem justificativa;
- nenhum vazamento de dados entre tenant ou especialidade;
- nenhum modal deixa scroll travado apos fechamento;
- loading, vazio e erro continuam distinguiveis;
- os cenarios criticos passam apos build e testes automatizados;
- toda melhoria de performance tem evidencia no Performance ou React Profiler.

Nao fixar metas absolutas antes do baseline. Primeiro registrar os valores
atuais; depois definir metas por cenario, mantendo como prioridade a ausencia
de regressao visual e funcional.

## Registro de evidencia

| Data | Cenario | Tenant | Cache | Throttling | Sintoma | Causa provavel | Mudanca | Resultado |
|------|---------|--------|-------|------------|---------|----------------|---------|-----------|
|      |         |        |       |            |         |                |         |           |

## Comandos de validacao do projeto

Executar na raiz de `frontend-clinic` apos cada lote pequeno de mudancas:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Para mudancas restritas a um hook ou componente, preferir primeiro a validacao
mais estreita disponivel e depois repetir o conjunto completo antes de concluir
a fase.

## Gate antes do merge remoto

A revisao so sera considerada concluida quando todos os testes existentes
continuarem aprovados e o conjunto completo abaixo passar na raiz de
`frontend-clinic`:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Tambem devem estar registrados os cenarios manuais de Performance/Network e a
validacao dos fluxos Clinic relevantes. Somente depois desse gate o branch
podera ser integrado e publicado nos ambientes remotos Render e Vercel.

## Riscos e pendencias conhecidas

- `Home.tsx` continua sendo um shell importante; evitar adicionar ownership de
  modal ou regras de dados diretamente nele sem necessidade.
- `Modal.tsx` continua sensivel por lidar com scroll, foco e particularidades do
  WebKit.
- A Agenda possui infraestrutura de retorno e storage; nao criar novas chaves
  ad hoc durante esta fase.
- A revisao do vinculo Telegram por `tenant_id` do JWT permanece uma pendencia
  de backend documentada separadamente.
