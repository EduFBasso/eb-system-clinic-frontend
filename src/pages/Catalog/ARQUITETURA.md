## 🗳️ TreatmentListPage.tsx (Lista de Serviços do Catálogo)
- O que faz: Renderiza a lista de todos os tratamentos persistidos no banco de dados e a barra de ferramentas superior com as opções de Pesquisa por texto, botão de ir para cadastro de + Novo, ativar fluxo de seleção para Apagar em massa e botão suspenso de Imprimir catálogo clínica A4.
Vazamento: Ela renderiza badges adicionais ou rotula o item como "Sem subcategoria" se a lista de escopos de tratamento (treatment_scopes que é tipado em Odonto...Helpers) estiver vazia (comum no caso da podologia).

## 🖋️ TreatmentFormPage.tsx (Formulário de Criação/Edição de Cadastro de Serviço)
- O que faz: Renderiza a tela limpa de cadastro de um novo procedimento no catálogo ou gerencia a edição de um existente (basePrice, name, description).
Vazamento: Ela herda a tipagem odontológica de ServiceFlowType e obriga o usuário a marcar ao menos uma subcategoria odontológica no fieldset (Por dente, Arcada ou Outros), barrando o envio com erro de validação ("Selecione ao menos um subescopo") caso a podóloga tente cadastrar um serviço sem subcategoria.

## 📦 ProductListPage.tsx (Lista de Produtos do Estoque)
- O que faz: Mostra as pílulas de estoque com valor, quantidade e descrição para visualização, remoção em lote ou navegação para edição.
Neutro: Totalmente agnóstico, pois produtos não possuem ligação física com anatomias (tanto odonto quanto podologia consomem o mesmo model de estoque).

## ✏️ ProductFormPage.tsx (Formulário de Cadastro/Edição de Produto)
- O que faz: Criação de novos insumos/produtos médicos e definição de preço base ou estoque.
Neutro: Sem vazamentos de domínio biológico.