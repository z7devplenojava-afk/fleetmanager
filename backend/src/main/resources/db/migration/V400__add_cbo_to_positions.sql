-- Adicionar coluna CBO (Código Brasileiro de Ocupação) na tabela positions
ALTER TABLE positions
    ADD COLUMN IF NOT EXISTS cbo VARCHAR(10);

COMMENT ON COLUMN positions.cbo IS 'Código Brasileiro de Ocupação (CBO)';

