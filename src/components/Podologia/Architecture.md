# Guia Arquitetural de Podologia e Catálogo Clínico

Este documento serve como mapa de arquitetura e guia de decisões para a coexistência simétrica das especialidades de **Odontologia** e **Podologia** (e futuras áreas clínicas), focando na eliminação de *"vazamentos de domínio"* (leaking) e no compartilhamento limpo de componentes através de uma estrutura escalável.

---

## 1. O Diagnóstico Técnico (O problema do "Leaking")

Ao analisar a tela **Editar Tratamento** (`pages/Catalog/TreatmentFormPage.tsx` ou similar, acessada via menu *NavBar → Catálogo → Tratamentos → Editar*), identificamos um vazamento clássico de domínio:
* O formulário exibe opções de **Subcategoria** que são estritamente odontológicas (`Por dente`, `Arcada` ou `Outros`).
* Quando uma clínica possui apenas `podologia` ativa nas `capabilities` do tenant, esses campos continuam sendo expostos na interface visual do catálogo geral.
* No banco de dados (backend), a tabela de serviços (`inventory.py`) possui um campo `treatment_scopes` que aceita exclusivamente escolhas do odonto. 
* Em contrapartida, as pastas físicas estão divididas de forma mista:
  1. `components/Podologia/`: Contém arquivos focados e isolados da especialidade.
  2. `components/Shared/`: Contém blocos perfeitamente genéricos (`TreatmentPlanCreateModal`, `ClinicalPrintView`, `TreatmentPlanListView`).
  3. `pages/Catalog/`: Contém telas que deveriam ser compartilhadas, mas que herdam código e conceitos acoplados à odontologia (`ServiceFlowType` do OdontoAnatomyHelpers).

---

## 2. Inventário dos Componentes Atuais de Podologia

No ecossistema atual do projeto, este é o papel de cada arquivo na pasta `components/Podologia/`:

```
components/Podologia/
├── PodologyAnatomyHelpers.ts        <- Contém tipos anatômicos específicos (PodologyScope,
│                                       PodologyServiceRow), constantes de coordenadas de desenho
│                                       (REGIONS) e labels legíveis de mapeamento. Centraliza a 
│                                       tradução humana (Pé Esquerdo - Dedo 1) livre de importações do React.
├── PodologyMemberGrid.tsx           <- Componente puramente visual (SVG). Contém a silhueta 2D
│                                       dos membros e os cliques interativos. Implementa a
│                                       Solução A de Zoom de viewBox em smartphones (< 480px)
│                                       orientado a abas sem bibliotecas de terceiros.
├── usePodologyItemFlows.ts          <- Controller (custom hook) que gerencia o fluxo de criação
│                                       de procedimentos anatômicos. Compõe o useClinicalItemFlows
│                                       geral e concatena as coordenadas no payload antes do envio.
├── PodologyPlanWorkspace.tsx        <- O workspace principal de orçamentos para clínicas de Podologia.
│                                       Instancia os cabeçalhos, o mini-mapa SVG passivo de visualização,
│                                       o seletor financeiro, as observações e o rodapé de impressão.
├── PodologyProcedureCard.tsx        <- Card individual que renderiza um procedimento já persistido,
│                                       mostrando de forma amigável onde ele foi feito (ex: Pé Esquerdo - Dedo 1).
├── PodologyEditProcedureModal.tsx   <- Popup de edição de itens existentes (permite alterar notas e preço).
├── PodologyServiceModal.tsx         <- Modal de inserção de múltiplos procedimentos com autocomplete
│                                       do catálogo e opção de registrar um tratamento customizado.
├── PodologyProductModal.tsx         <- Modal de inserção de produtos/insumos de estoque consumidos no
│                                       atendimento, integrado com autocomplete de produtos gerais.
└── ProductItemCard.tsx              <- Card de renderização de produtos já adicionados ao orçamento.
```

---

## 3. Diretriz para Escalonamento de Futuras Áreas

Para permitir a adição de novas especialidades (ex: Fisioterapia, Estética, Dermatologia) com segurança, rapidez e sem poluir o catálogo de serviços existente, estabelecemos as seguintes regras:

### Regra I: O Princípio Open-Closed de Formulários de Cadastro
Formulários no catálogo geral (`pages/Catalog/*`) devem renderizar suas seções complementares de forma **condicional baseada em capacidades**, ou utilizar um **mecanismo de registro dinâmico**:

```tsx
// Exemplo conceitual para TreatmentFormPage.tsx
const capabilities = useMemo(readLoggedProfessionalCapabilities, []);

return (
    <Form>
        <InputLabel>Nome do Tratamento/Serviço</InputLabel>
        <Input />

        {/* Renderização condicional por capacidade ativa no Tenant */}
        {hasOdontoCapability(capabilities) && (
            <OdontoSubcategorySelector />
        )}
        
        {hasPodologiaCapability(capabilities) && (
            <PodologySubcategorySelector /> 
        )}
    </Form>
);
```

### Regra II: Estrutura Geral Simétrica de Pastas
Para evitar dispersão de arquivos em `pages/` e `components/`, cada ecossistema clínico deve adotar uma estrutura simétrica fechada. Toda especialidade nova deve nascer em uma pasta dedicada contendo:

1. **`AnatomyHelpers.ts`**: Tipos, constantes de layout e conversores específicos.
2. **`MemberGrid.tsx`**: Componente visual de mapeamento (se houver, ex: corpo humano para fisioterapia).
3. **`use[Specialty]ItemFlows.ts`**: Hook co-locado que envelopa `useClinicalItemFlows` neutro.
4. **`[Specialty]PlanWorkspace.tsx`**: Tela mãe do fluxo que envelopa a herança de layout do workspace.
5. Custom modais específicos de inserção que exigem dados anatômicos.

Os arquivos que não possuem dependência de conhecimento físico ou biológico (como listas de orçamentos, termos genéricos, lógicas financeiras de parcelamento) devem morar exclusivamente em `components/Shared/`.

---

## 4. Estudo de Organização: Compartilhamento vs Isolamento

| Nível de Componente | Localização Correta | Regra de Ouro de Dependência |
| :--- | :--- | :--- |
| **Especializado** | `components/Podologia/`, `components/Odonto/` | **Nunca** importa nada de outra especialidade. Pode importar helpers utilitários neutros de `utils/` ou hooks de `hooks/`. |
| **Geral / Cadastro** | `pages/Catalog/`, `pages/Clients/` | Consome dados genéricos das APIs de inventário. Exibe painéis adicionais apenas avaliando as `capabilities` ativas do Tenant logado. |
| **Neutro Compartilhado** | `components/Shared/` | É 100% agnóstico à anatomia. Recebe cabeçalhos, listas, funções de salvamento e dados formatados via propriedades (React props). |

Com essa estrutura, quando criarmos uma nova vertical (ex: `Fisioterapia`), nós apenas:
1. Criaremos a pasta `components/Fisioterapia/` com suas lógicas específicas.
2. Adicionaremos a verificação `hasFisioterapiaCapability` onde o cadastro geral (catálogo/anamnese) se bifurca.
3. Todo o resto do micro-SaaS (banco de dados, multi-tenancy, autenticação, controle de assinaturas, agenda, faturamento) funcionará herdando as lógicas genéricas compartilhadas sem que um único arquivo precise ser reescrito do zero.
