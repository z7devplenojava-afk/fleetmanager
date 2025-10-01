# Módulo de Conciliação Bancária

## Visão Geral

O módulo de Conciliação Bancária permite gerenciar contas bancárias e realizar conciliações entre os saldos do sistema e os extratos bancários, garantindo a consistência e precisão dos dados financeiros.

## Funcionalidades Principais

### 1. Gestão de Contas Bancárias
- **Cadastro de Contas**: Criação e edição de contas bancárias
- **Tipos de Conta**: Conta Corrente, Poupança, Investimento
- **Status**: Ativação/Desativação de contas
- **Informações**: Nome, banco, agência, número da conta, saldo atual

### 2. Importação de Extratos
- **Formatos Suportados**: CSV, Excel (.xlsx), OFX
- **Importação Automática**: Processamento de arquivos de extrato
- **Validação**: Verificação de dados e tratamento de erros
- **Mapeamento**: Configuração de colunas para diferentes formatos

### 3. Conciliação Bancária
- **Criação Manual**: Nova conciliação com data de referência
- **Conciliação Automática**: Matching automático entre sistema e banco
- **Diferenças**: Identificação e tratamento de divergências
- **Status**: Pendente, Em Andamento, Concluída, Cancelada

### 4. Itens de Conciliação
- **Tipos**: Matched, Bank Only, System Only, Adjustment
- **Status**: Pendente, Confirmado, Rejeitado
- **Ajustes Manuais**: Criação de lançamentos de ajuste
- **Observações**: Notas e justificativas

### 5. Relatórios e Análises
- **Resumo**: Estatísticas gerais das conciliações
- **Exportação**: Relatórios em PDF e Excel
- **Diferenças**: Análise de itens não conciliados
- **Histórico**: Acompanhamento temporal das conciliações

## Componentes

### Principais
- `ConciliacaoBancaria.tsx` - Componente principal com tabs
- `BankAccountsTable.tsx` - Tabela de contas bancárias
- `ReconciliationsTable.tsx` - Tabela de conciliações
- `BankStatementsTable.tsx` - Tabela de extratos (placeholder)

### Modais
- `BankAccountFormModal.tsx` - Formulário de conta bancária
- `ReconciliationFormModal.tsx` - Formulário de nova conciliação
- `ImportStatementModal.tsx` - Importação de extratos
- `ReconciliationViewModal.tsx` - Visualização detalhada

### Serviços
- `bankReconciliationService.ts` - API calls para o backend
- `types/bankReconciliation.ts` - Tipos TypeScript

## Fluxo de Trabalho

### 1. Configuração Inicial
1. Cadastrar contas bancárias
2. Configurar informações básicas (banco, agência, conta)
3. Definir saldo inicial

### 2. Importação de Dados
1. Baixar extrato do banco
2. Importar arquivo via interface
3. Validar dados importados
4. Corrigir erros se necessário

### 3. Processo de Conciliação
1. Criar nova conciliação
2. Informar saldo bancário na data de referência
3. Executar conciliação automática
4. Revisar itens identificados
5. Confirmar ou rejeitar matches
6. Criar ajustes manuais se necessário
7. Finalizar conciliação

### 4. Análise e Relatórios
1. Visualizar resumo das conciliações
2. Analisar diferenças não conciliadas
3. Exportar relatórios
4. Acompanhar tendências

## Permissões

O módulo utiliza o sistema de permissões do módulo financeiro:
- `VIEW_FINANCIAL` - Visualizar dados financeiros
- `MANAGE_FINANCIAL` - Gerenciar contas e conciliações
- `ADMIN_FINANCIAL` - Acesso completo

## Integração com Backend

### Endpoints Esperados
```
GET    /api/financial/bank-accounts
POST   /api/financial/bank-accounts
PUT    /api/financial/bank-accounts/{id}
DELETE /api/financial/bank-accounts/{id}

GET    /api/financial/bank-statements
POST   /api/financial/bank-statements/import
POST   /api/financial/bank-statements

GET    /api/financial/reconciliations
POST   /api/financial/reconciliations
GET    /api/financial/reconciliations/{id}
POST   /api/financial/reconciliations/{id}/auto-reconcile
PATCH  /api/financial/reconciliations/{id}/complete
PATCH  /api/financial/reconciliations/{id}/cancel

GET    /api/financial/reconciliations/summary
GET    /api/financial/reconciliations/{id}/export
```

### Estrutura de Dados
- Contas bancárias com informações completas
- Extratos com transações detalhadas
- Conciliações com itens e status
- Relatórios com métricas e análises

## Próximos Passos

### Funcionalidades Futuras
1. **Conciliação Automática Avançada**
   - Machine learning para melhor matching
   - Regras personalizáveis de conciliação
   - Histórico de padrões

2. **Integração Bancária**
   - API Open Banking
   - Importação automática de extratos
   - Sincronização em tempo real

3. **Análises Avançadas**
   - Dashboards interativos
   - Alertas automáticos
   - Previsões e tendências

4. **Auditoria e Compliance**
   - Log de todas as operações
   - Trilha de auditoria
   - Relatórios regulatórios

### Melhorias Técnicas
1. **Performance**
   - Paginação para grandes volumes
   - Cache de dados frequentes
   - Otimização de queries

2. **UX/UI**
   - Drag & drop para arquivos
   - Visualização de diferenças
   - Shortcuts de teclado

3. **Validações**
   - Validação de arquivos mais robusta
   - Detecção de duplicatas
   - Verificação de integridade

## Configuração de Desenvolvimento

### Dependências
- React Query para cache e sincronização
- React Hook Form para formulários
- Date-fns para manipulação de datas
- Lucide React para ícones

### Estrutura de Arquivos
```
components/financeiro/
├── ConciliacaoBancaria.tsx
├── BankAccountsTable.tsx
├── ReconciliationsTable.tsx
├── BankStatementsTable.tsx
├── BankAccountFormModal.tsx
├── ReconciliationFormModal.tsx
├── ImportStatementModal.tsx
└── ReconciliationViewModal.tsx

services/
└── bankReconciliationService.ts

types/
└── bankReconciliation.ts

pages/
└── ConciliacaoBancaria.tsx
```

### Testes
- Testes unitários para componentes
- Testes de integração para serviços
- Testes E2E para fluxos completos
- Mock de APIs para desenvolvimento

## Suporte e Documentação

Para dúvidas ou sugestões sobre o módulo de Conciliação Bancária:
1. Consulte esta documentação
2. Verifique os tipos TypeScript
3. Analise os componentes de exemplo
4. Entre em contato com a equipe de desenvolvimento