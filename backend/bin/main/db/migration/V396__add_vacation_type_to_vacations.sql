-- Adicionar coluna vacation_type à tabela vacations
ALTER TABLE vacations 
ADD COLUMN IF NOT EXISTS vacation_type VARCHAR(50) DEFAULT 'NORMAL';

-- Comentário na coluna
COMMENT ON COLUMN vacations.vacation_type IS 'Tipo de férias: NORMAL, SOLD, PECUNIARY_BONUS';










