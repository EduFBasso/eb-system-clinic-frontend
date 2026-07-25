# Anamnesis FormElements Refactor Plan

Este plano fecha o escopo apenas no frontend do projeto clinic, com foco na limpeza, padronizacao e reorganizacao de `src/components/FormElements` para o cadastro de Anamnese.

Nao inclui mudancas de backend neste momento.

Tambem considera o contexto atual da arquitetura:

- frontend com deploy separado na Vercel
- backend compartilhado em outra frente
- direcao futura de SaaS com um backend servindo multiplos frontends e multiplos usuarios

## Objetivo

Reduzir a complexidade do cadastro de Anamnese no frontend, removendo o modelo antigo de "um componente para cada pergunta", consolidando componentes genericos e deixando `FormElements` como uma camada previsivel e reutilizavel.

O objetivo nao e expandir comportamento agora.

O objetivo e estabilizar a base para evolucao futura.

## Leitura pratica do estado atual

Hoje existem tres camadas misturadas:

1. A camada ativa do cadastro de Anamnese.
2. A camada de componentes base usados por formularios atuais.
3. A camada legado da Anamnese antiga, com componentes especificos por campo.

Na pratica, o fluxo atual da Anamnese esta concentrado em:

- `src/components/ClientForm/ClientForm.tsx`
- `src/hooks/useClientAnamnesis.ts`
- `src/components/ClientAnamnesisForm/ClientAnamnesisForm.tsx`

Ja `src/components/FormElements` guarda duas realidades diferentes:

- primitives ainda uteis, como input/select
- componentes especificos antigos que nao devem continuar sendo o modelo estrutural

## Achados do inventario

### 1. O centro real da Anamnese nao esta em FormElements

O renderer atual da Anamnese e dinamico, baseado em schema, setores e dependencias.

Isso significa que a pasta `FormElements` nao deve voltar a ser o lugar da regra de negocio da Anamnese.

Ela deve ser o lugar de primitives e blocos genericos de UI.

### 2. Existem duplicacoes de camada base

Hoje ha sobreposicao entre:

- `src/components/FormElements/InputField.tsx`
- `src/components/FormElements/InputField/InputField.tsx`
- `src/components/FormElements/SelectField/SelectField.tsx`
- `src/components/FormKit/SelectField.tsx`
- `src/components/FormKit/TextAreaField.tsx`

Isso indica que o frontend acabou criando duas mini-bibliotecas de formulario ao mesmo tempo.

### 3. Ha varios componentes especificos da Anamnese antiga

Exemplos:

- `FootwearUsedField.tsx`
- `MedicalHistoryField.tsx`
- `PainSensitivityField.tsx`
- `SockUsedField.tsx`
- `SensitivityTest.tsx`
- `PlantarViewLeft.tsx`
- `PlantarViewRight.tsx`
- `NailChangesLeft.tsx`
- `NailChangesRight.tsx`
- `DeformitiesLeft.tsx`
- `DeformitiesRight.tsx`
- `DermatologicalPathologiesLeft.tsx`
- `DermatologicalPathologiesRight.tsx`

Esses arquivos representam exatamente o padrao que nao faz mais sentido proteger: um componente por pergunta, por lateralidade ou por grupo fixo de opcoes.

### 4. Parte desses arquivos ja tem tamanho suficiente para justificar modularizacao ou aposentadoria

Arquivos como `FootwearUsedField.tsx`, `MedicalHistoryField.tsx`, `PlantarViewLeft.tsx` e seus equivalentes por lado mostram que a complexidade antiga foi distribuida horizontalmente em muitos componentes pequenos e medios, em vez de ser consolidada em uma linguagem unica de formulario.

O problema nao e apenas quantidade de linhas.

O problema principal e que a complexidade esta repetida em varias variacoes do mesmo padrao:

- radio simples
- radio com campo adicional
- checkbox com opcao Outros
- listas laterais esquerda/direita

## Decisao estrutural para o frontend

Para esta revisao, `FormElements` deve ser tratado como uma camada de primitives e blocos genericos.

Nao deve ser tratado como uma pasta de componentes de dominio nomeados por pergunta clinica.

Em outras palavras:

- `FormElements` fica com UI generica
- a Anamnese fica com orquestracao, schema, regras de visibilidade e composicao
- componentes especificos antigos viram alvo de migracao ou remocao

## Direcao de padronizacao

### Manter o que for mais simples e mais generico

A regra aqui nao deve ser "mais antigo" ou "mais novo".

Deve ser:

- o mais simples
- o mais previsivel
- o que melhor suporta schema dinamico
- o que exige menos bifurcacoes por pergunta

### Conjunto alvo de componentes base

O cadastro de Anamnese pode ser coberto por poucos componentes genericos.

Sugestao de conjunto alvo:

1. `TextField`
Campo simples de texto.

2. `TextAreaField`
Campo de texto longo.

3. `SingleChoiceField`
Escolha unica por radio ou pills.

4. `SingleChoiceWithDetailField`
Para perguntas do tipo:
- `Sim` / `Nao`
- se `Sim`, exibir input adicional

Exemplo de persistencia visual:
- `Sim: Dipirona`
- `Sim: Losartana`

5. `MultiChoiceField`
Lista de checks para multiplas respostas.

6. `MultiChoiceWithOtherField`
Lista de checks com opcao `Outros` e texto complementar.

Exemplo de serializacao atual possivel no frontend:
- `Diabete, Pressao Alta, Outros: Tireoide`

7. `SectionBlock`
Bloco visual de setor da Anamnese.

8. `FieldLabel` ou equivalente leve
Somente se realmente necessario. Nao vale manter `SectionTitle` como dependencia estrutural se isso so empurra mais um wrapper legado.

### O que nao deve continuar

Nao devemos continuar com componentes como:

- um componente por comorbidade
- um componente por pergunta isolada
- um componente por lado apenas porque o label muda
- um componente que embute string fixa de dominio quando a diferenca real e so lista de opcoes

Se a diferenca couber em props ou schema, nao deve existir arquivo novo.

## Padrao de valor para perguntas compostas

Mesmo sem alterar backend agora, o frontend ja pode ser organizado com um padrao consistente para montagem e exibicao de respostas compostas.

### Caso 1. Sim ou Nao com detalhamento

Persistencia textual esperada:

- `Nao`
- `Sim: <detalhe>`

Exemplos:

- `Sim: Losartana e Metformina`
- `Sim: Cirurgia no joelho em 2023`

### Caso 2. Multi escolha com Outros

Persistencia textual esperada:

- `Opcao A, Opcao B, Outros: <detalhe>`

Exemplo:

- `Diabete, Pressao Alta, Outros: Tireoidite`

### Caso 3. Opcao Outro em escolha unica

Persistencia textual esperada:

- `Outro`
- `Outro: <detalhe>`

Esse padrao ja aparece no renderer atual e deve ser mantido como contrato de exibicao no frontend enquanto o backend nao entrar em novo escopo.

## Estrutura alvo da pasta

Uma direcao coerente para `src/components/FormElements` seria:

```text
src/components/FormElements/
  fields/
    TextField.tsx
    TextAreaField.tsx
    SelectField.tsx
    SingleChoiceField.tsx
    SingleChoiceWithDetailField.tsx
    MultiChoiceField.tsx
    MultiChoiceWithOtherField.tsx
  layout/
    FieldShell.tsx
    SectionBlock.tsx
  shared/
    formPrimitives.module.css
    optionParsing.ts
```

Observacao importante:

`SelectField` pode permanecer se fizer sentido para formularios gerais do sistema, mas a Anamnese em si deve se apoiar principalmente nos campos de escolha e texto, nao em componentes clinicos nomeados.

## O que revisar e classificar na limpeza

Cada arquivo atual de `FormElements` deve cair em uma destas categorias:

### Categoria A. Manter e consolidar

Arquivos que ja sao primitives ou quase primitives.

Exemplos provaveis:

- `InputField/InputField.tsx`
- `SelectField/SelectField.tsx`
- estilos base reutilizaveis

### Categoria B. Absorver em componentes genericos

Arquivos que representam um padrao valido, mas estao presos a um dominio especifico.

Exemplos provaveis:

- `ConditionalRadioField.tsx` deve virar uma versao generica de escolha com detalhe
- `MedicalHistoryField.tsx` deve virar um multi escolha com `Outros`
- `FootwearUsedField.tsx` deve virar uma escolha unica com `Outro`

### Categoria C. Migrar e remover

Arquivos que sao so instancias antigas de schema fixo.

Exemplos provaveis:

- campos por lado esquerdo/direito
- componentes clinicos com listas hardcoded e naming especifico

### Categoria D. Duplicidade fora do eixo principal

Arquivos que competem com o mesmo papel em `FormKit` ou em outro ponto do frontend.

Aqui a decisao deve ser unificar para evitar duas APIs internas para formularios.

## Modularizacao por tamanho e responsabilidade

Se um arquivo misturar duas ou mais responsabilidades, ele ja e candidato a modularizacao, mesmo que nao seja enorme.

Criticos para modularizar:

1. Arquivos que concentram parsing de valor, UI e regras de exibicao.
2. Arquivos que tem muita string de dominio hardcoded.
3. Arquivos que repetem logica de `Outro`, `Sim: detalhe` ou lista de checks.
4. Arquivos com variacoes esquerda/direita que poderiam virar dados.

Na pratica, a modularizacao deve separar:

- componente visual
- parsing/serializacao de string composta
- configuracao de opcoes

## Plano de execucao no frontend

### Fase 0. Validacao visual antes da limpeza

Objetivo:

- decidir a linguagem visual dos campos reaproveitaveis antes da migracao
- evitar nova ruptura visual percebida pela profissional
- comparar comportamento de tema sem tocar no cadastro real

Entrega esperada:

- pagina isolada de preview em `/debug/anamnesis-fields`
- mock funcional dos dois padroes prioritarios:
  - `Sim` / `Nao` com detalhe quando `Sim`
  - checks multiplos com `Outros` e texto complementar
- confirmacao visual do que parece mais profissional antes da limpeza estrutural

### Fase 0.1. Extracao do kit visual reutilizavel

Objetivo:

- tirar do mock os blocos repetidos e virar primitives reutilizaveis dentro de `FormElements`
- usar o mock como primeiro consumidor real dessas primitives
- reduzir a chance de cada campo clinico voltar como componente isolado

Entrega esperada:

- shell visual comum de campo
- escolha unica com destaque visual
- input de detalhe para casos de `Sim: detalhe`
- checkbox com `Outros` e texto complementar

Esse kit e o ponto de partida para a limpeza dos componentes soltos e para a substituicao gradual dos arquivos antigos de anamnese.

### Fase 1. Inventario e classificacao

Objetivo:

- marcar o que esta ativo
- marcar o que e legado
- marcar duplicacoes
- marcar arquivos sem uso

Entrega esperada:

- lista final A/B/C/D para toda a pasta `FormElements`

### Fase 2. Definir a API interna dos componentes genericos

Objetivo:

- fechar props padrao
- fechar estrategia de estilos
- fechar formato de eventos `onChange`
- fechar comportamento de `Outro` e `Sim: detalhe`

Entrega esperada:

- um conjunto pequeno de components base prontos para substituir os antigos

### Fase 3. Extrair parsing e serializacao

Objetivo:

- tirar do componente a logica de concatenacao textual repetida

Exemplos:

- montar `Sim: detalhe`
- separar `Outro: detalhe`
- montar lista CSV legivel para exibicao

Entrega esperada:

- helpers reutilizaveis e testes focados nesses contratos

### Fase 4. Refatorar o renderer da Anamnese para consumir apenas primitives

Objetivo:

- fazer `ClientAnamnesisForm` renderizar por tipo generico
- impedir a volta do padrao de campo clinico hardcoded

Entrega esperada:

- renderer mais curto
- melhor legibilidade
- menos tratamento especial espalhado

### Fase 5. Aposentar componentes especificos antigos

Objetivo:

- remover componentes sem uso
- remover duplicatas simples
- manter compatibilidade enquanto houver migracao parcial

Entrega esperada:

- `FormElements` com menos arquivos, menos naming de dominio e menos ambiguidade

### Fase 6. Unificar linguagem com FormKit

Objetivo:

- decidir se `FormKit` absorve `FormElements` base
- ou se `FormElements` absorve os campos base de `FormKit`

Regra de decisao:

- manter uma unica API para fields basicos no frontend

Esta fase continua dentro do frontend, mas deve ser feita sem expandir escopo para backend.

## Decisao recomendada para este projeto

Pelo estado atual, a recomendacao pratica e:

1. Manter como base principal os componentes mais simples e mais usados pelos formularios atuais.
2. Tratar `ConditionalRadioField`, `FootwearUsedField` e `MedicalHistoryField` como fonte de padrao, nao como destino final.
3. Nao criar novos componentes nomeados por pergunta clinica.
4. Remover a dependencia estrutural de componentes laterais fixos esquerda/direita sempre que a diferenca puder virar dados.
5. Escolher um unico eixo para os campos base entre `FormElements` e `FormKit`.

## Fora de escopo agora

Este plano nao cobre:

- mudancas no contrato do backend
- novos tipos persistidos no backend
- redefinicao do ownership tenant/profissional
- migracoes de banco
- compartilhamento multi app no backend SaaS

Esses pontos devem ser tratados em outra frente, depois que a camada de frontend estiver limpa e organizada.

## Resultado esperado ao final da revisao

Se este plano for seguido, o frontend deve terminar com:

- menos arquivos em `FormElements`
- menos componentes de dominio hardcoded
- um pequeno conjunto de componentes genericos para Anamnese
- renderer mais previsivel
- menor custo de manutencao
- base mais segura para a futura divisao SaaS sem carregar legado inutil da fase monorepo

## Status atual da implementacao

O refactor ja avancou para o conjunto central descrito neste plano:

- `src/components/FormElements/AnamnesisPreview/AnamnesisPreviewFields.tsx` concentra os blocos genericos reutilizaveis
- `src/components/ClientAnamnesisForm/ClientAnamnesisForm.tsx` ja consome esses blocos para renderizar campos dinamicos
- os wrappers legados por pergunta foram removidos quando nao havia mais consumidores
- o mock visual foi removido depois de cumprir o papel de validacao de linguagem visual e comportamento por tema
- existe teste de componente cobrindo dependencia de campo e serializacao de `Outro: detalhe`

A limpeza de duplicidades da agenda tambem avançou:

- rotinas comuns de data foram centralizadas em `src/utils/dateHelpers.ts`
- `FloatingDatePicker`, `ScheduleEditorCore`, `useAvailabilityCalc` e os modais de agenda passaram a compartilhar a mesma base de calculo
- a duplicacao de helpers locais de `startOfDay`, `addDays`, `startOfMonth` e `overlaps` foi reduzida nos pontos mais usados

## Documentacao de API futura

A documentacao final de integracao com backend deve ser escrita quando o contrato de API estiver alinhado entre frontend e backend.

Esse documento final deve registrar, no minimo:

- formato de persistencia das respostas compostas
- regras de serializacao para `Sim: detalhe`, `Outro: detalhe` e multiplas escolhas
- nomes dos campos e expectativas do schema vindo do backend
- comportamento de compatibilidade durante a migracao

Enquanto isso, este plano continua sendo a referencia de arquitetura do frontend.