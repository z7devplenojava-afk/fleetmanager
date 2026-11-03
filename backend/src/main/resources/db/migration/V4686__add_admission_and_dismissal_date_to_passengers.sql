-- V4686: Adicionar campos de data de admissão e demissão para funcionários/passageiros
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS admission_date DATE;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS dismissal_date DATE;

-- Comentários para documentação do schema
COMMENT ON COLUMN passengers.admission_date IS 'Data de admissão do colaborador na empresa contratante';
COMMENT ON COLUMN passengers.dismissal_date IS 'Data de desligamento/demissão do colaborador';

