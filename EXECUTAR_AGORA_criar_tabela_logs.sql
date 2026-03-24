-- ==========================================
-- EXECUTAR AGORA - Criar tabela de logs
-- ==========================================
-- Execute este SQL no DBeaver conectado ao banco LOCAL
-- Base de dados: secured_guard (não secured_guard_ci)

-- 1. Criar tabela payslip_delivery_logs
CREATE TABLE IF NOT EXISTS payslip_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    channel VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 1,
    error_message VARCHAR(500),
    file_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_cpf ON payslip_delivery_logs(cpf);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_month_year ON payslip_delivery_logs(month, year);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_channel ON payslip_delivery_logs(channel);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_success ON payslip_delivery_logs(success);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_created_at ON payslip_delivery_logs(created_at DESC);

-- 3. Verificar se foi criada
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'payslip_delivery_logs';

-- Deve retornar 1 linha:
-- payslip_delivery_logs | BASE TABLE

-- 4. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payslip_delivery_logs'
ORDER BY ordinal_position;

-- Deve retornar 11 colunas

-- ==========================================
-- PRONTO! Agora teste o envio novamente
-- ==========================================

