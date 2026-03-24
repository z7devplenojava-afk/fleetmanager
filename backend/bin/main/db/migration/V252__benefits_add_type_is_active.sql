-- Adiciona colunas opcionais type e is_active em benefits

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'benefits' AND column_name = 'type'
    ) THEN
        ALTER TABLE benefits ADD COLUMN type VARCHAR(30);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'benefits' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE benefits ADD COLUMN is_active BOOLEAN;
    END IF;
END $$;

-- Índices opcionais (não obrigatórios, idempotentes)
CREATE INDEX IF NOT EXISTS idx_benefits_type ON benefits(type);
CREATE INDEX IF NOT EXISTS idx_benefits_is_active ON benefits(is_active);

