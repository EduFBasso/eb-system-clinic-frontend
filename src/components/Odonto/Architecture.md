# Guia Arquitetural de Odontologia e Catálogo Clínico

Este documento serve como mapa de arquitetura e guia de decisões para a coexistência simétrica das especialidades de **Odontologia** e **Podologia** (e futuras áreas clínicas), focando na eliminação de *"vazamentos de domínio"* (leaking) e no compartilhamento limpo de componentes através de uma estrutura de ecossistema clínico isolada.

---

## 1. O Isolamento de Domínio Clínico

No âmbito do odontograma e do catálogo de serviços clínicas, a Odontologia possui regras de negócio específicas que não devem vazar para outras áreas:
* O tratamento odontológico pode ter escopos específicos: por dente (`tooth`), por arcada superior/inferior (`arch`) ou serviços gerais (`other`).
* Esses escopos são validados pelo backend (`inventory.py`) no campo `treatment_scopes` e não fazem sentido para outras capacidades como Podologia.
* Para garantir a legibilidade e escalabilidade do código, todos os componentes e utilitários que lidam de forma direta com dentes, superfícies ou arcadas ficam contidos na pasta de escopo especializado do Odonto.

---

## 2. Inventário dos Componentes Atuais de Odontologia

No ecossistema atual do projeto, este é o papel de cada arquivo na pasta `components/Odonto/`:

```
components/Odonto/
├── OdontoAnatomyHelpers.ts        <- Contém tipos anatômicos odontológicos (ServiceFlowType, ServiceRow,
│                                     ToothItem), as constantes estruturadas da boca (ORDERED_TEETH),
│                                     opções de faces de dentes (SURFACE_OPTIONS) e conversores para o payload (dentalContextFromServiceRow).
├── OdontoToothGrid/
│   ├── OdontoToothGrid.tsx        <- Componente gráfico (SVG interativo). Renderiza todos os dentes
│   │                                 com suas faces clicáveis (M, D, V, L, O) para a seleção no odontograma.
│   └── ToothPill.tsx              <- Componente celular de dente individual.
├── useOdontoItemFlows.ts          <- Controller (custom hook) que gerencia o fluxo de criação
│                                     de procedimentos anatômicos odontológicos. Compõe o useClinicalItemFlows
│                                     geral e valida / concatena os dentes e faces antes do envio à API.
├── OdontoPlanWorkspace.tsx        <- O workspace principal de orçamentos para clínicas de Odontologia.
│                                     Orquestra os cabeçalhos, o odontograma SVG permanente, as observações,
│                                     as listagens do plano de tratamento e as impressões.
├── OdontoProcedureCard.tsx        <- Card individual que renderiza um procedimento odontológico persistido,
│                                     mostrando de forma amigável o dente e as faces selecionadas (ex: 11 - V, D).
├── OdontoEditProcedureModal.tsx   <- Popup de edição rápida de registros clínicos do Odonto.
├── OdontoServiceModal.tsx         <- Modal de inserção de múltiplos procedimentos odontológicos com autocomplete e seletor anatômico de dente/arcada.
└── OdontoProductModal.tsx         <- Modal de inserção de produtos/insumos de estoque consumidos no odontograma.
```

---

## 3. Padrão de Testagem Reutilizável

O ecossistema conta com testes específicos (`src/components/Odonto/__tests__/`) que impedem regressões e validam a correta separação de domínios:
* `OdontoAnatomyHelpers.test.ts`: Garante que a conversão de domínios do modelo visual para o payload do DRF segue o contrato exato.
* `OdontoProcedureCard.test.tsx`: Garante que dados de dentes/faces são impressos de forma legível por dente ou geral.
* `OdontoServiceModal.test.tsx`: Testa autocompletes, exclusões do catálogo e filtragem por tipo de fluxo de tratamento.
* `OdontoProductModal.test.tsx`: Verifica o adicionamento correto de produtos sem duplicidade com o estoque.
