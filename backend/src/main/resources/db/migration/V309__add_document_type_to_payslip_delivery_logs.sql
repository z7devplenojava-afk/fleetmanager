-- =====================================================
-- Migration V309: Melhorias nos logs de envio
-- =====================================================
-- Permite registrar logs de HOLERITE, COMPROVANTE e UNIFICADO
-- Adiciona nome do funcionário e nome do arquivo para melhor rastreabilidade

-- 1. Adicionar coluna document_type
ALTER TABLE payslip_delivery_logs 
ADD COLUMN document_type VARCHAR(20);

-- Atualizar registros existentes para HOLERITE (padrão anterior)
UPDATE payslip_delivery_logs 
SET document_type = 'HOLERITE' 
WHERE document_type IS NULL;

-- Tornar a coluna NOT NULL após atualizar valores existentes
ALTER TABLE payslip_delivery_logs 
ALTER COLUMN document_type SET NOT NULL;

-- Adicionar constraint de valores válidos
ALTER TABLE payslip_delivery_logs 
ADD CONSTRAINT check_document_type 
CHECK (document_type IN ('HOLERITE', 'COMPROVANTE', 'UNIFICADO'));

-- 2. Adicionar coluna employee_name (nome do funcionário)
ALTER TABLE payslip_delivery_logs 
ADD COLUMN employee_name VARCHAR(255);

-- 3. Adicionar coluna file_name (nome do arquivo enviado)
ALTER TABLE payslip_delivery_logs 
ADD COLUMN file_name VARCHAR(500);

-- 4. Adicionar índices para melhorar performance
CREATE INDEX idx_payslip_delivery_logs_document_type 
ON payslip_delivery_logs(document_type);

CREATE INDEX idx_payslip_delivery_logs_employee_name 
ON payslip_delivery_logs(employee_name);

CREATE INDEX idx_payslip_delivery_logs_cpf_period 
ON payslip_delivery_logs(cpf, month, year);

-- 5. Comentários nas colunas
COMMENT ON COLUMN payslip_delivery_logs.document_type IS 'Tipo de documento enviado: HOLERITE, COMPROVANTE ou UNIFICADO';
COMMENT ON COLUMN payslip_delivery_logs.employee_name IS 'Nome do funcionário destinatário (para facilitar identificação nos logs)';
COMMENT ON COLUMN payslip_delivery_logs.file_name IS 'Nome do arquivo enviado (para rastreabilidade completa)';

