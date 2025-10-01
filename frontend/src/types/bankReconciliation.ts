export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  agency: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankStatement {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  reference?: string;
  category?: string;
  isReconciled: boolean;
  reconciledAt?: string;
  reconciledBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankReconciliation {
  id: string;
  accountId: string;
  account: BankAccount;
  referenceDate: string;
  initialBalance: number;
  finalBalance: number;
  bankBalance: number;
  systemBalance: number;
  difference: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reconciliationItems: ReconciliationItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  completedAt?: string;
  completedBy?: string;
}

export interface ReconciliationItem {
  id: string;
  reconciliationId: string;
  statementId?: string;
  transactionId?: string;
  type: 'MATCHED' | 'BANK_ONLY' | 'SYSTEM_ONLY' | 'ADJUSTMENT';
  description: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationSummary {
  totalReconciliations: number;
  pendingReconciliations: number;
  completedReconciliations: number;
  totalDifference: number;
  averageReconciliationTime: number;
  lastReconciliationDate?: string;
}

export interface CreateBankAccountRequest {
  name: string;
  bank: string;
  agency: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  initialBalance?: number;
}

export interface CreateReconciliationRequest {
  accountId: string;
  referenceDate: string;
  bankBalance: number;
  notes?: string;
}

export interface ImportStatementRequest {
  accountId: string;
  file: File;
  format: 'CSV' | 'OFX' | 'EXCEL';
  dateColumn?: string;
  descriptionColumn?: string;
  amountColumn?: string;
  typeColumn?: string;
}

export interface ReconciliationFilters {
  accountId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface StatementFilters {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  isReconciled?: boolean;
  type?: 'DEBIT' | 'CREDIT';
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}