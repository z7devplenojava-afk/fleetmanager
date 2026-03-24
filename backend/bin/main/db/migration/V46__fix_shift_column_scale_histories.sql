-- Garante a existência da coluna shift na tabela scale_histories
ALTER TABLE scale_histories ADD COLUMN IF NOT EXISTS shift VARCHAR(20);

-- Preenche registros existentes com valor padrão
UPDATE scale_histories SET shift = 'MORNING' WHERE shift IS NULL;

-- Torna a coluna NOT NULL
ALTER TABLE scale_histories ALTER COLUMN shift SET NOT NULL; 