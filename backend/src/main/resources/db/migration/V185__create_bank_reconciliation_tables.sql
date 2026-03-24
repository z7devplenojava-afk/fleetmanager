-- Migration para criar tabelas de conciliação bancária
-- V317__create_bank_reconciliation_tables.sql

-- Tabela de contas bancárias
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_type VARCHAR(50),
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de arquivos bancários
CREATE TABLE bank_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    period VARCHAR(50),
    status VARCHAR(20) DEFAULT 'UPLOADED',
    total_records INTEGER,
    matched_records INTEGER,
    unmatched_records INTEGER,
    file_size VARCHAR(20),
    description VARCHAR(500),
    file_path VARCHAR(500),
    error_message VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de transações bancárias
CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_file_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    reference_number VARCHAR(100),
    category VARCHAR(100),
    notes VARCHAR(500),
    system_transaction_id UUID,
    system_transaction_type VARCHAR(50),
    reconciliation_date DATE,
    reconciliation_user VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_file_id) REFERENCES bank_files(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_bank_accounts_bank_name ON bank_accounts(bank_name);
CREATE INDEX idx_bank_accounts_account_number ON bank_accounts(account_number);
CREATE INDEX idx_bank_accounts_status ON bank_accounts(status);

CREATE INDEX idx_bank_files_bank_name ON bank_files(bank_name);
CREATE INDEX idx_bank_files_account_number ON bank_files(account_number);
CREATE INDEX idx_bank_files_status ON bank_files(status);
CREATE INDEX idx_bank_files_created_at ON bank_files(created_at);

CREATE INDEX idx_bank_transactions_bank_file_id ON bank_transactions(bank_file_id);
CREATE INDEX idx_bank_transactions_transaction_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_transactions_status ON bank_transactions(status);
CREATE INDEX idx_bank_transactions_system_transaction_id ON bank_transactions(system_transaction_id);

-- Comentários nas tabelas
COMMENT ON TABLE bank_accounts IS 'Tabela para armazenar contas bancárias da empresa';
COMMENT ON TABLE bank_files IS 'Tabela para armazenar arquivos de extrato bancário importados';
COMMENT ON TABLE bank_transactions IS 'Tabela para armazenar transações extraídas dos arquivos bancários';

-- Comentários nas colunas principais
COMMENT ON COLUMN bank_accounts.bank_name IS 'Nome do banco';
COMMENT ON COLUMN bank_accounts.account_number IS 'Número da conta bancária';
COMMENT ON COLUMN bank_accounts.balance IS 'Saldo atual da conta';

COMMENT ON COLUMN bank_files.file_name IS 'Nome do arquivo original';
COMMENT ON COLUMN bank_files.file_type IS 'Tipo do arquivo (PDF, CSV, EXCEL)';
COMMENT ON COLUMN bank_files.status IS 'Status do processamento do arquivo';
COMMENT ON COLUMN bank_files.total_records IS 'Total de registros no arquivo';
COMMENT ON COLUMN bank_files.matched_records IS 'Registros conciliados com sucesso';
COMMENT ON COLUMN bank_files.unmatched_records IS 'Registros não conciliados';

COMMENT ON COLUMN bank_transactions.transaction_date IS 'Data da transação';
COMMENT ON COLUMN bank_transactions.amount IS 'Valor da transação';
COMMENT ON COLUMN bank_transactions.balance IS 'Saldo após a transação';
COMMENT ON COLUMN bank_transactions.status IS 'Status da conciliação da transação';
COMMENT ON COLUMN bank_transactions.system_transaction_id IS 'ID da transação no sistema (se conciliada)';

-- Inserir dados de exemplo
INSERT INTO bank_accounts (id, bank_name, account_number, account_type, balance, status, description) VALUES
(gen_random_uuid(), 'Banco do Brasil', '12345-6', 'Conta Corrente', 125000.50, 'ACTIVE', 'Conta principal da empresa'),
(gen_random_uuid(), 'Itaú Unibanco', '98765-4', 'Conta Corrente', 85000.00, 'ACTIVE', 'Conta secundária para operações'),
(gen_random_uuid(), 'Bradesco', '54321-0', 'Poupança', 15000.00, 'ACTIVE', 'Conta poupança para reservas');

-- Inserir arquivos de exemplo
INSERT INTO bank_files (id, file_name, file_type, bank_name, account_number, period, status, total_records, matched_records, unmatched_records, file_size, description) VALUES
(gen_random_uuid(), 'extrato_bb_jan2024.pdf', 'PDF', 'Banco do Brasil', '12345-6', 'Janeiro 2024', 'COMPLETED', 150, 120, 30, '2.5 MB', 'Extrato mensal - Janeiro 2024'),
(gen_random_uuid(), 'extrato_itau_fev2024.csv', 'CSV', 'Itaú Unibanco', '98765-4', 'Fevereiro 2024', 'PROCESSING', 200, 0, 0, '1.8 MB', 'Extrato mensal - Fevereiro 2024');
