-- TASK 02: Adiciona campos financeiros na tabela payslips para comparação de holerites
-- Permite detectar diferenças entre holerites do mesmo funcionário/empresa/período
-- baseado em valores financeiros (Total Vencimentos, Total Descontos, Valor Líquido)

ALTER TABLE payslips
    ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS net_value NUMERIC(15, 2);

-- Índice para facilitar consultas por valores financeiros
CREATE INDEX IF NOT EXISTS idx_payslips_financial_values
    ON payslips(total_earnings, total_deductions, net_value);

-- Comentários nas colunas para documentação
COMMENT ON COLUMN payslips.total_earnings IS 'Total de vencimentos do holerite (Total Vencimentos)';
COMMENT ON COLUMN payslips.total_deductions IS 'Total de descontos do holerite (Total Descontos)';
COMMENT ON COLUMN payslips.net_value IS 'Valor líquido do holerite (Valor Líquido)';

