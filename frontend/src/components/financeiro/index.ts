// Componentes principais do módulo financeiro
export { ModuloFinanceiro } from './ModuloFinanceiro';
export { ContasAPagar } from './ContasAPagar';
export { ContasAReceber } from './ContasAReceber';
export { Pagamentos } from './Pagamentos';
export { FluxoCaixa } from './FluxoCaixa';
export { default as ConciliacaoBancaria } from './ConciliacaoBancaria';

// Sistema de permissões
export { 
  FinanceiroPermissionGuard,
  ContasAPagarGuard,
  ContasAReceberGuard,
  PagamentosGuard,
  FluxoCaixaGuard,
  RelatoriosFinanceirosGuard
} from './FinanceiroPermissionGuard';

// Componentes existentes
export { FinanceiroDashboard } from './FinanceiroDashboard';
export { FinanceiroRelatorios } from './FinanceiroRelatorios';
export { ContasAPagarTable } from './ContasAPagarTable';
export { ContasAPagarDashboard } from './ContasAPagarDashboard';
export { ContasAPagarFormModal } from './ContasAPagarFormModal';
export { TransacaoFormModal } from './TransacaoFormModal';
export { FaturaFormModal } from './FaturaFormModal';
export { FaturaViewModal } from './FaturaViewModal';
export { ConfirmarPagamentoModal } from './ConfirmarPagamentoModal';
export { ProvisioningTable } from './ProvisioningTable';

// Componentes de medição (mantidos para compatibilidade)
export { default as MeasurementCompleteTable } from './MeasurementCompleteTable';
export { default as MeasurementSimpleTable } from './MeasurementSimpleTable';
export { MeasurementBulletinModal } from './MeasurementBulletinModal';
export { SimplifiedMeasurementModal } from './SimplifiedMeasurementModal';
export { MeasurementValidationModal } from './MeasurementValidationModal';
export { MeasurementDeleteDialog } from './MeasurementDeleteDialog';
export { MeasurementViewModal } from './MeasurementViewModal';

// Componentes de Conciliação Bancária
export { default as BankAccountsTable } from './BankAccountsTable';
export { default as ReconciliationsTable } from './ReconciliationsTable';
export { default as BankStatementsTable } from './BankStatementsTable';
export { default as BankAccountFormModal } from './BankAccountFormModal';
export { default as ReconciliationFormModal } from './ReconciliationFormModal';
export { default as ImportStatementModal } from './ImportStatementModal';
export { default as ReconciliationViewModal } from './ReconciliationViewModal';
