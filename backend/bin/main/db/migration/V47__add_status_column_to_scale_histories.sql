-- Adicionar coluna status à tabela scale_histories
ALTER TABLE scale_histories ADD COLUMN status VARCHAR(20);

-- Preencher registros existentes com valor padrão
UPDATE scale_histories SET status = 'PENDING' WHERE status IS NULL;

-- Tornar a coluna NOT NULL
ALTER TABLE scale_histories ALTER COLUMN status SET NOT NULL; 