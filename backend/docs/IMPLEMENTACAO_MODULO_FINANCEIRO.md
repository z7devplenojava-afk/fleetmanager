# Implementação do Módulo Financeiro

## Visão Geral

Este documento descreve a implementação completa do módulo financeiro baseado no modelo Excel fornecido pelo cliente, integrado ao sistema SecuredGuard existente.

## Componentes Implementados

### 1. Enums
- **ExpenseType**: Define os tipos de despesa (FIXA, VARIAVEL)
- **ExpenseStatus**: Define os status das faturas (PENDENTE, PAGA, SOLICITADA, ERRO, CANCELADA, etc.)

### 2. Entidades
- **Supplier**: Entidade para gerenciar fornecedores
- **Invoice**: Entidade expandida para faturas/despesas com novos campos

### 3. DTOs
- **SupplierDTO**: Para transferência de dados de fornecedores
- **InvoiceDTO**: Para transferência de dados de faturas

### 4. Repositórios
- **SupplierRepository**: Operações de banco para fornecedores
- **InvoiceRepository**: Operações de banco para faturas (expandido)

### 5. Serviços
- **SupplierService**: Lógica de negócio para fornecedores
- **InvoiceService**: Lógica de negócio para faturas

### 6. Controllers
- **SupplierController**: Endpoints REST para fornecedores
- **InvoiceController**: Endpoints REST para faturas

### 7. Migrations
- **V218**: Criação da tabela suppliers
- **V219**: Atualização da tabela invoices

## Funcionalidades Implementadas

### Fornecedores
- ✅ CRUD completo
- ✅ Busca por nome, CNPJ, email, cidade, estado
- ✅ Filtros avançados
- ✅ Ativação/desativação
- ✅ Validação de CNPJ
- ✅ Categorização

### Faturas/Despesas
- ✅ CRUD completo
- ✅ Busca por status, tipo, fornecedor, cliente, categoria
- ✅ Filtros avançados
- ✅ Controle de vencimento
- ✅ Marcação como paga
- ✅ Cancelamento
- ✅ Código de barras
- ✅ Categorização

### Relatórios
- ✅ Valores por status
- ✅ Valores por tipo
- ✅ Valores por fornecedor
- ✅ Valores por categoria
- ✅ Contagem por status/tipo
- ✅ Total pendente
- ✅ Total vencido
- ✅ Total pago em período
- ✅ Resumo financeiro

## Segurança

### Permissões Implementadas
- **SUPER_ADMIN**: Acesso total a todos os endpoints
- **FINANCIAL_READ**: Leitura de dados financeiros
- **FINANCIAL_CREATE**: Criação de registros financeiros
- **FINANCIAL_WRITE**: Edição de registros financeiros
- **FINANCIAL_DELETE**: Exclusão de registros financeiros

### Endpoints Protegidos
Todos os endpoints estão protegidos com `@PreAuthorize` incluindo o ROLE SUPER_ADMIN para acesso total.

## Estrutura do Banco de Dados

### Tabela suppliers
```sql
- id (BIGINT, PK)
- name (VARCHAR(255), NOT NULL)
- cnpj (VARCHAR(18), UNIQUE, NOT NULL)
- email (VARCHAR(255))
- phone (VARCHAR(20))
- address (VARCHAR(255))
- city (VARCHAR(100))
- state (VARCHAR(2))
- zip_code (VARCHAR(10))
- category (VARCHAR(100))
- notes (TEXT)
- is_active (BOOLEAN, DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabela invoices (atualizada)
```sql
- id (BIGINT, PK)
- invoice_number (VARCHAR(50), NOT NULL)
- description (VARCHAR(500), NOT NULL)
- amount (DECIMAL(10,2), NOT NULL)
- type (VARCHAR(20), DEFAULT 'VARIAVEL')
- status (VARCHAR(20), NOT NULL)
- issue_date (DATE, NOT NULL)
- due_date (DATE, NOT NULL)
- payment_date (DATE)
- category (VARCHAR(100))
- barcode (VARCHAR(255))
- supplier_id (BIGINT, FK)
- client_id (BIGINT, FK)
- contract_id (BIGINT, FK)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Endpoints Disponíveis

### Fornecedores (/api/suppliers)
- `GET /` - Listar fornecedores (paginado)
- `GET /all` - Listar todos os fornecedores
- `GET /{id}` - Buscar por ID
- `GET /cnpj/{cnpj}` - Buscar por CNPJ
- `GET /email/{email}` - Buscar por email
- `GET /search?name=...` - Buscar por nome
- `GET /city/{city}` - Buscar por cidade
- `GET /state/{state}` - Buscar por estado
- `GET /filters` - Filtros avançados
- `POST /` - Criar fornecedor
- `PUT /{id}` - Atualizar fornecedor
- `DELETE /{id}` - Excluir fornecedor
- `PATCH /{id}/toggle-status` - Alternar status
- `GET /categories` - Listar categorias
- `GET /stats/count` - Estatísticas

### Faturas (/api/invoices)
- `GET /` - Listar faturas (paginado)
- `GET /all` - Listar todas as faturas
- `GET /{id}` - Buscar por ID
- `GET /status/{status}` - Buscar por status
- `GET /type/{type}` - Buscar por tipo
- `GET /supplier/{supplierId}` - Buscar por fornecedor
- `GET /client/{clientId}` - Buscar por cliente
- `GET /category/{category}` - Buscar por categoria
- `GET /overdue` - Faturas vencidas
- `GET /due-soon/{days}` - Faturas vencendo em breve
- `GET /paid-in-period` - Faturas pagas em período
- `GET /filters` - Filtros avançados
- `POST /` - Criar fatura
- `PUT /{id}` - Atualizar fatura
- `DELETE /{id}` - Excluir fatura
- `PATCH /{id}/status` - Atualizar status
- `PATCH /{id}/mark-as-paid` - Marcar como paga
- `PATCH /{id}/cancel` - Cancelar fatura

### Relatórios (/api/invoices/reports)
- `GET /amount-by-status` - Valores por status
- `GET /amount-by-type` - Valores por tipo
- `GET /amount-by-supplier` - Valores por fornecedor
- `GET /amount-by-category` - Valores por categoria
- `GET /count-by-status` - Contagem por status
- `GET /count-by-type` - Contagem por tipo
- `GET /total-paid-in-period` - Total pago em período
- `GET /total-pending` - Total pendente
- `GET /total-overdue` - Total vencido
- `GET /summary` - Resumo financeiro

## Validações Implementadas

### Fornecedores
- Nome obrigatório
- CNPJ obrigatório e único
- Formato de CNPJ válido
- Email válido (quando informado)

### Faturas
- Número da fatura obrigatório
- Descrição obrigatória
- Valor obrigatório e maior que zero
- Data de vencimento obrigatória

## Próximos Passos

1. **Frontend**: Implementar interfaces para o módulo financeiro
2. **Testes**: Criar testes unitários e de integração
3. **Documentação**: Documentar APIs no Swagger
4. **Otimizações**: Implementar cache para relatórios
5. **Integração**: Conectar com outros módulos do sistema

## Observações

- Todos os endpoints incluem o ROLE SUPER_ADMIN para acesso total
- As migrations são compatíveis com o banco existente
- A implementação segue os padrões do projeto
- Documentação Swagger incluída em todos os endpoints
- Validações robustas implementadas
- Índices de banco otimizados para performance 