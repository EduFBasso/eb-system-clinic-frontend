# Anamnesis Manual Test Guide

Este guia resume o fluxo local recomendado para validar o cadastro de Anamnese enquanto o frontend e o backend continuam evoluindo em conjunto.

## Como subir o ambiente local

1. Backend

```bash
cd /Users/eduardofigueiredobasso/Documents/Dev/eb_micro_SaaS/eb-system/backend
./.venv/bin/python manage.py runserver 0.0.0.0:8000
```

2. Frontend

```bash
cd /Users/eduardofigueiredobasso/Documents/Dev/eb_micro_SaaS/eb-system/frontend-clinic
npm run dev -- --host
```

## Melhor estratégia para teste manual

### Reutilizar a cliente existente

Se já existir uma cliente fictícia no tenant/profissional ativo, ela pode ser usada normalmente para teste manual.

Isso é o melhor quando você quer validar:

- carregamento dos campos dinâmicos
- edição de respostas já existentes
- comportamento de dependências entre campos
- persistência em `bulk_save`

### Quando preferir criar uma cliente nova

Crie uma nova cliente de teste se você quiser:

- validar o fluxo completo do zero
- evitar ruído de respostas antigas de anamnese
- simular um cadastro recém-criado

### Quando apagar apenas as respostas de Anamnese

Na maioria dos casos, isso é melhor do que apagar a cliente inteira.

Use essa opção quando você quer reiniciar só o formulário de Anamnese, mantendo o restante do cadastro intacto.

Motivos:

- a exclusão de cliente pode remover dados relacionados em cascata
- a resposta de anamnese já é separada por cliente e campo
- o backend aceita limpeza via `bulk_save` com lista vazia de respostas

## Como limpar apenas a Anamnese de uma cliente

Opções seguras:

1. Pelo Django admin
- apagar os registros de `AnamnesisResponse` da cliente alvo

2. Pelo backend
- enviar `POST /anamnesis/responses/bulk_save/` com `responses: []` para a cliente alvo

3. Pelo banco de dados em último caso
- remover apenas `AnamnesisResponse` daquela cliente

### Recomendação prática

- Se a ideia é testar a UI e a serialização: mantenha a cliente e limpe só as respostas de anamnese.
- Se a ideia é testar onboarding completo: crie uma cliente nova.
- Se a ideia é testar destruição/remoção real: use a cliente atual e confirme o efeito final.

## Como o backend cria campos dinâmicos

A Anamnese é dirigida por `AnamnesisField`.

Cada campo pertence a um profissional e vem do endpoint:

- `GET /anamnesis/fields/`

O frontend monta a tela dinamicamente a partir dessa lista.

### Campos principais de um campo dinâmico

- `professional`: profissional dono do campo
- `code`: identificador estável
- `sector`: agrupamento visual
- `sector_order`: ordem do setor
- `label`: texto da pergunta
- `field_type`: `radio`, `text` ou `textarea`
- `options`: lista de opções para `radio`
- `placeholder`: dica visual
- `depends_on`: campo pai
- `show_when_value`: valor que habilita o campo dependente
- `order`: ordem dentro do setor
- `is_active`: liga/desliga sem apagar histórico

### Como adicionar um novo campo

Há dois caminhos principais:

1. Django admin
- abrir `AnamnesisField`
- criar o campo para o profissional correto
- preencher `code`, `sector`, `field_type`, `options`, `depends_on` e `show_when_value`

2. Seed/command
- usar `apps/anamnesis/management/commands/seed_anamnesis.py`
- ou `scripts/seed_common_anamnesis_fields.py` para os campos comuns

### Regra importante

O serializer de `bulk_save` valida se o campo pertence ao profissional autenticado.

Então, se você estiver logado como um profissional, só conseguirá salvar campos que pertençam a esse mesmo profissional/tenant.

## Fluxo de persistência

- O frontend busca os campos em `GET /anamnesis/fields/`
- O frontend busca as respostas existentes em `GET /anamnesis/responses/?client=<id>`
- O frontend salva em `POST /anamnesis/responses/bulk_save/`
- Respostas ausentes no payload final são removidas para aquela cliente

## O que observar no teste manual

- se os setores aparecem na ordem correta
- se os campos dependentes só abrem quando o valor do pai corresponde
- se `Outro: detalhe` grava e reabre corretamente
- se um campo removido no backend some da tela após refresh
- se a resposta salva preserva o label em `field_label_snap`

## Dica de validação rápida

Depois de criar ou alterar um campo no backend, basta recarregar o frontend e abrir a mesma cliente.

Se o campo estiver ativo e pertencer ao profissional autenticado, ele deve aparecer automaticamente sem ajuste adicional no frontend.
