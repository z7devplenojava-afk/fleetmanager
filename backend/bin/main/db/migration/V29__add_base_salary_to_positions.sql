-- Adicionar coluna base_salary se não existir (já foi adicionada na V2)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'positions' AND column_name = 'base_salary'
    ) THEN
        ALTER TABLE positions ADD COLUMN base_salary FLOAT;
    END IF;
END $$; 