-- Tornar opcionais os vínculos de benefício com funcionário e posição
-- Deixa employee_id e position_id como NULLABLE para suportar benefícios globais

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'benefits' AND column_name = 'employee_id'
    ) THEN
        -- Remover NOT NULL se existir
        BEGIN
            ALTER TABLE benefits ALTER COLUMN employee_id DROP NOT NULL;
        EXCEPTION WHEN others THEN NULL;
        END;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'benefits' AND column_name = 'position_id'
    ) THEN
        -- Remover NOT NULL se existir
        BEGIN
            ALTER TABLE benefits ALTER COLUMN position_id DROP NOT NULL;
        EXCEPTION WHEN others THEN NULL;
        END;
    END IF;
END $$;

-- Índices úteis (idempotentes)
CREATE INDEX IF NOT EXISTS idx_benefits_employee_id ON benefits(employee_id);
CREATE INDEX IF NOT EXISTS idx_benefits_position_id ON benefits(position_id);

