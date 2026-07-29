# ClientCard Architecture

> Documento de referência para entender responsabilidades, fluxo de dados,
> eventos, hooks e plano de refatoração incremental do componente `ClientCard`.

## Visão Geral

`ClientCard` é um componente central que:

- Exibe dados principais do cliente (nome, idade, contato, endereço).
- Exibe estado de agenda: pendente, agendado (scheduled), em andamento
    (ongoing), futuros agendamentos.
- Fornece ações rápidas: visualizar cliente, abrir agenda mensal/semanal,
    criar/editar agendamento rápido, finalizar atendimento.
- Reage a eventos globais customizados para manter consistência na UI sem prop
    drilling extenso.

O objetivo da refatoração é reduzir o acoplamento, simplificar a leitura
(arquivo hoje ~1000 linhas) e encapsular heurísticas em hooks específicos.

## Mapa Atual de Componentes e Arquivos

### Núcleo do Card

- `ClientCard.tsx`
        - Orquestra estado local e integra hooks de domínio (pending, ongoing,
            create action, future appointments).
        - Renderiza dados pessoais do cliente e delega blocos complexos para
            subcomponentes.

### Subcomponentes Extraídos (Refatoração)

- `ClientCardAgendaSection.tsx`
        - Isola todo o bloco de agenda: informações de consulta, andamento,
            fallback de datas, pendências e lista de futuros agendamentos.
        - Centraliza ações relacionadas à agenda (abrir agenda mensal, editar
            agendamento, disparar confirmação via WhatsApp).
        - Recebe formatter por props para reduzir acoplamento com detalhes de
            apresentação.

- `EditClientActionsModal.tsx`
        - Modal mobile-friendly de decisão ao clicar em editar.
        - Centraliza as ações: edição local do prontuário e disparo do fluxo de
            solicitação de anamnese via WhatsApp (token + link).
        - Isola controle visual e de bloqueio durante loading.

### Utilitários Externos Relevantes

- `src/utils/whatsapp.ts`
        - Normaliza telefone (`normalizePhoneDigits`), monta URL do WhatsApp
            (`buildWhatsAppUrl`) e abstrai abertura segura em nova aba
            (`openWhatsAppInNewTab`).
        - Remove lógica de string/URL de dentro do `ClientCard`.

- `src/utils/agendaPresentation.ts`
        - Centraliza formatação de datas/intervalos de agenda
            (`formatAppointmentDateRange`).
        - Remove duplicação de lógica de data e reduz risco de divergência visual.

## Responsabilidades Atuais

- Dados básicos: renderização direta de props `client`.
- Pending: determinação e ação via `useClientPendingState`.
- Ongoing: heurística robusta via `useClientOngoingState` (snapshot + sweep +
    probe + latch + hysterese).
- Futuros: fetch incremental encapsulado em `useClientFutureAppointments`.
- Agenda: renderização principal isolada em `ClientCardAgendaSection`.
- Edição / ações rápidas: modal isolado em `EditClientActionsModal`.
- Ações +: botão de criação adaptativo (pendente, limite atingido, ongoing).
- Odonto (arcada): ícone de dente (`FaTooth`) condicional por especialidade e
    navegação para `/odonto/arcada/:id`.
- Finalização: encapsulada por `useFinalizeAppointment` + callback
    `afterFinalizeSuccess` vindo do hook ongoing.
- Estilo: centralizado em `useClientCardStyle` (cores, bordas, supressões).
- Scroll / Foco: efeito que responde a evento `scrollToClientCard` para
    auto-scroll suave.
- WhatsApp: montagem de URL/abertura extraída para `src/utils/whatsapp.ts`.
- Datas de agenda: formatação extraída para
    `src/utils/agendaPresentation.ts`.

## Hooks Utilizados

### 1. `useClientPendingState`

- Entrada: `{ client, now }`
- Saída: `effectivePending`, `openPendingActions()`,
    `tryOpenPendingElseQuick(fallback)`.
- Heurística: tenta inferir pendência quando cliente possuía compromisso recém
    finalizado/cancelado e ainda não foi resolvido, com fallback eventual a
    fetch assíncrono.

### 2. `useClientOngoingState`

- Entrada: `{ client, now, enableProbe, debug }`
- Interno: snapshot, sweep global, probe condicional, latch persistente,
    hysterese (delay de entrada), supressão pós-finalização.
- Saída: `isOngoing`, `displayStartISO`, `displayEndISO`, `effectiveApptId`,
    `afterFinalizeSuccess()`, `hasTrustedWindow`.
- Eventos: escuta `appointments:changed`, `client:clearOngoing`,
    `scrollToClientCard` (dispatch). Telemetria quando entra em ongoing.

### 3. `useClientCardStyle`

- Entrada: `{ isOngoing, selected, pressed, isScheduled, isPending }`
- Saída: tokens de estilo (cores, opacidades, estilo container, etc.).

### 4. `useFinalizeAppointment`

- Gerencia estado de finalização (`finishing`) e executa chamada ao backend.

### 5. `useClientFutureAppointments`

- Entrada: `{ client, isScheduled }`
- Saída: `futureAppointments`, `loadingFuture`, `dynLimit`, `totalScheduled`,
    `limitReached`, `refetch()`.
- Responsabilidade: encapsular fetch de futuros agendamentos e aviso de limite
    via `systemMessage`.

### 6. Odonto Arcade Access (ClientCard)

- Leitura de `loggedProfessional` (localStorage) para identificar especialidade.
- Liberação do ícone de dente quando especialidade indica contexto odontológico
    (`odonto`, `dent`, `ortodont`).
- Clique no ícone navega para `/odonto/arcada/:clientId`.
- Observação: como a checagem é memoizada na montagem do card, alterações de
    especialidade no mesmo ciclo de sessão podem exigir refresh para refletir.

### 7. `useClientCreateAction`

- Objetivo: unificar lógica do botão + considerando estados: pendente,
    ongoing, limite atingido e criação rápida.
- Situação: em uso no `ClientCard` e no bloco de agenda extraído.

## Eventos Globais Relevantes

| Evento                 | Origem                                  | Efeito no Card                                     |
| ---------------------- | --------------------------------------- | -------------------------------------------------- |
| `appointments:changed` | Qualquer criação/alteração/cancel       | Refetch futuros, clear/adjust ongoing latch (hook) |
| `scrollToClientCard`   | Lógica de foco/diagnóstico/hook ongoing | Auto-scroll e seleção suave                        |
| `client:clearOngoing`  | Ação externa (ex: finalize global)      | Limpa latch + suprime ongoing temporariamente      |
| `pendingActions:open`  | Interação UI externa                    | Modal global abre (hook pending apenas dispara)    |
| `updateClients`        | Pós-persistência                        | Recarrega lista/estado superior (fora do Card)     |
| `systemMessage`        | Diversos                                | Exibe toast/warning global                         |

## Fluxo de Renderização Simplificado

1. Dados básicos.
2. (Separador) se há qualquer agenda (scheduled, ongoing ou futuros).
3. Linha Agenda (tipo) com botão + (condicional) e ícone de agenda mensal.
4. Linha Data (mostra janela atual formatada ou —).
5. Notas do compromisso atual (scheduled ou ongoing).
6. Bloco "Em andamento" com botão de finalizar (se ongoing).
7. Fallback Data quando não há agendamento (mostra 'Compromisso pendente' ou
   'Sem agendamento' + ações).
8. Lista de futuros agendamentos.

## Regras Principais de Estado

| Estado          | Critério                                         | Exibição de Data                | Botão +                            | Notas                             | Bloco Ongoing |
| --------------- | ------------------------------------------------ | ------------------------------- | ---------------------------------- | --------------------------------- | ------------- |
| Pending isolado | `effectivePending && !isScheduled && !isOngoing` | "Compromisso pendente"          | Abre PendingActions                | Não (sem agendamento ativo)       | Não           |
| Scheduled       | Próximo compromisso futuro                       | Datas formatadas                | Cria novo (se limite não atingido) | Sim                               | Não           |
| Ongoing         | Janela atual confiável                           | Datas formatadas (janela atual) | Desabilitado                       | Sim (do compromisso em andamento) | Sim           |
| Sem agendamento | Nenhum dos anteriores                            | "Sem agendamento"               | Cria novo                          | Não                               | Não           |

## Plano de Refatoração Incremental

1. (DONE) Extrair pending logic → `useClientPendingState`.
2. (DONE) Extrair ongoing logic → `useClientOngoingState`.
3. (DONE) Extrair futuro: `useClientFutureAppointments`.
4. (DONE) Unificar botão + com `useClientCreateAction`.
5. (DONE) Extrair modal de decisão de edição → `EditClientActionsModal`.
6. (DONE) Extrair seção de agenda/consultas → `ClientCardAgendaSection`.
7. (DONE) Externalizar utilitários de WhatsApp e apresentação de data
    (`src/utils/whatsapp.ts`, `src/utils/agendaPresentation.ts`).
8. Ajustar bordas de seleção (1px normal / 2px selecionado) direto no
   `useClientCardStyle`.
9. Reduzir `ClientCard` para < ~500 linhas via movimentação de blocos auxiliares
   (e.g., DataLine, AgendaHeader, FutureListSection) ou simplesmente manter JSX
   porém sem efeitos longos.
10. Atualizar test suite para cobrir: pending fallback, latch ongoing, supress
   pós-finalização, limite de futuros, botão + em cada cenário.
11. Documentar invariantes e heurísticas das janelas de ongoing (já em parte
   descrito aqui).

## Próximos Passos Técnicos Imediatos

- Revisar memo de permissão odontológica para reagir a mudanças de sessão sem
    depender de reload (opcional, baixo risco).
- Consolidar critérios de disponibilidade do botão + em um hook único
    (`useClientScheduleAction`) para reduzir ramificações no JSX.

## Considerações de Performance

- `useClientOngoingState` evita probe por cliente salvo se flag habilitada
    (`VITE_ENABLE_ONGOING_PROBE`).
- Sweep global (não mostrado aqui) minimiza chamadas por cliente.
- Future appointments fetch restrito por `limit` dinâmico + debounced via
    eventos.
- Hysterese reduz flicker de transições scheduled→ongoing.

## Testes Recomendados (Vitest)

1. Pending: render de fallback "Compromisso pendente" + clique abre
   pendingActions (mock event dispatch).
2. Ongoing: quando `now` dentro da janela -> exibe bloco Em andamento e
   desabilita botão +.
3. Auto-latch: simular finalize que limpa ongoing e suprime retorno temporário.
4. Future limit warning: simular retorno > dynLimit e checar dispatch de
   `systemMessage`.
5. Botão + em cada estado (pending, scheduled dentro do limite, limite atingido,
   ongoing).

## Decisões de Design (Resumo)

- Remoção de pill explícita de pendência para reduzir clutter visual.
- Centralização de heurísticas complexas em hooks para permitir evolução sem
    inflar JSX.
- Uso de eventos globais leve para orquestrar interações entre cards e modais
    sem store global pesado.

---

Última atualização: 2026-07-29
