-- Migration V4649: Adicionar coluna points na tabela fines
ALTER TABLE fines ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
COMMENT ON COLUMN fines.points IS 'Pontos na CNH do motorista devido à infração';
