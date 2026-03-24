-- Adicionar coluna date à tabela scale_histories
ALTER TABLE scale_histories ADD COLUMN date DATE;

-- Atualizar registros existentes com a data atual
UPDATE scale_histories SET date = CURRENT_DATE WHERE date IS NULL;

-- Tornar a coluna NOT NULL após atualizar os registros existentes
ALTER TABLE scale_histories ALTER COLUMN date SET NOT NULL; 