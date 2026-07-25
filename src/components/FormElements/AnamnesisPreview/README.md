# AnamnesisPreview Contract

Este diretório concentra os componentes reaproveitáveis para montagem de campos de anamnese.

## Objetivo

- evitar criar um componente por pergunta
- manter um contrato simples para serialização em string
- permitir variação por profissional sem duplicação de UI

## Regras de serialização

1. Sim/Não com detalhe
- `Não`
- `Sim: <detalhe>`

2. Escolha única com `Outro`
- `<opção da lista>`
- `Outro`
- `<prefixo configurado>: <detalhe>`

3. Múltipla escolha com `Outros`
- `Opção A, Opção B`
- `Opção A, Outros: <detalhe>`

## Helpers centrais

- `parseConcatenatedEntries(value)`
- `buildConcatenatedEntries(entries)`
- `parseYesNoDetail(value)`

Esses helpers são o ponto único para manter consistência da concatenação.

## Como adicionar um novo campo

1. Escolha o padrão:
- escolha única
- escolha única com detalhe em `Outro`
- múltipla escolha com `Outros`
- sim/não com detalhe quando sim

2. Passe apenas configuração:
- `label`
- `helper`
- `options`
- `otherPrefix` quando necessário
- `placeholder`

3. Evite criar componente dedicado por domínio.

Se a diferença couber em props, deve permanecer no mesmo componente genérico.

## Validacao atual

- O renderer dinamico de anamnese em `ClientAnamnesisForm` ja consome este kit.
- O mock visual temporario cumpriu o papel de validar linguagem e foi removido depois da consolidacao do contrato.
- Existe teste de componente cobrindo regra de dependencia e serializacao `Outro: detalhe`.