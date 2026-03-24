-- Adiciona campo JSON para armazenar dados detalhados da tabela de vencimentos/descontos
-- Permite comparar linhas individuais (Cód, Descrição, Referência, Vencimentos, Descontos)
-- para detectar alterações mais precisas entre holerites

ALTER TABLE payslips
    ADD COLUMN IF NOT EXISTS table_details JSONB;

-- Índice GIN para consultas eficientes em JSONB
CREATE INDEX IF NOT EXISTS idx_payslips_table_details_gin
    ON payslips USING GIN (table_details);

-- Comentário na coluna para documentação
COMMENT ON COLUMN payslips.table_details IS 'Dados detalhados da tabela de vencimentos/descontos em formato JSON (array de objetos com codigo, descricao, referencia, vencimentos, descontos)';

