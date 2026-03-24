-- Script para diagnosticar problema de arquivos de holerites não encontrados

-- 1. Verificar holerites cadastrados
SELECT 
    id,
    employee_name AS "Nome Funcionário",
    cpf AS "CPF",
    month AS "Mês",
    year AS "Ano",
    file_name AS "Nome do Arquivo",
    processed_at AS "Data Processamento"
FROM payslips
WHERE cpf = '00824310608'
ORDER BY year DESC, month DESC
LIMIT 10;

-- 2. Verificar TODOS os holerites (ver padrão de nomes de arquivos)
SELECT 
    id,
    employee_name,
    cpf,
    month,
    year,
    file_name,
    LENGTH(file_name) AS "Tamanho Nome",
    processed_at
FROM payslips
ORDER BY processed_at DESC
LIMIT 20;

-- 3. Verificar estrutura da tabela payslips
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payslips'
ORDER BY ordinal_position;

-- 4. Verificar se tabela payslip_delivery_logs existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'payslip_delivery_logs';

-- 5. Se tabela não existe, criar manualmente (copiar da migration V299)
-- Execute este bloco se a tabela não existir:

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

CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_cpf ON payslip_delivery_logs(cpf);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_month_year ON payslip_delivery_logs(month, year);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_channel ON payslip_delivery_logs(channel);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_success ON payslip_delivery_logs(success);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_created_at ON payslip_delivery_logs(created_at DESC);

-- 6. Verificar logs de tentativas anteriores (depois que a tabela existir)
SELECT 
    cpf,
    month,
    year,
    channel,
    success,
    attempts,
    error_message,
    file_path,
    created_at
FROM payslip_delivery_logs
WHERE cpf = '00824310608'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Estatísticas de envios
SELECT 
    channel AS "Canal",
    success AS "Sucesso",
    COUNT(*) AS "Total",
    COUNT(DISTINCT cpf) AS "CPFs Únicos"
FROM payslip_delivery_logs
GROUP BY channel, success
ORDER BY channel, success;

