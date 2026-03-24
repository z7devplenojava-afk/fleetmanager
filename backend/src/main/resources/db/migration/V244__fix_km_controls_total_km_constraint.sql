-- Migração para corrigir a constraint da coluna total_km na tabela km_controls
-- V1016__fix_km_controls_total_km_constraint.sql

-- Remover a coluna total_km gerada automaticamente
ALTER TABLE km_controls DROP COLUMN IF EXISTS total_km;

-- Recriar a coluna total_km como uma coluna normal (não gerada)
ALTER TABLE km_controls ADD COLUMN total_km INTEGER;

-- Adicionar constraint que permite valores negativos quando há justificativa
ALTER TABLE km_controls ADD CONSTRAINT chk_km_controls_total_km_positive 
CHECK (
    (total_km >= 0) OR 
    (final_km = 0 AND final_km_justification IS NOT NULL AND final_km_justification != '')
);

-- Comentário atualizado
COMMENT ON COLUMN km_controls.total_km IS 'Quilometragem total percorrida (calculada automaticamente, pode ser 0 quando há justificativa)';
