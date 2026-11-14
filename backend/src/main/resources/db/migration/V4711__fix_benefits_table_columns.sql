-- V4711: Garantir colunas necessárias na tabela benefits para sincronia com a entidade JPA Benefit
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'benefits') THEN
        -- is_active
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'benefits' AND column_name = 'is_active') THEN
            ALTER TABLE benefits ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;

        -- se existir coluna legada 'active', sincronizar
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'benefits' AND column_name = 'active') THEN
            UPDATE benefits SET is_active = active WHERE is_active IS NULL;
        END IF;

        -- type
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'benefits' AND column_name = 'type') THEN
            ALTER TABLE benefits ADD COLUMN type VARCHAR(30) DEFAULT 'OTHER';
        END IF;

        -- company_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'benefits' AND column_name = 'company_id') THEN
            ALTER TABLE benefits ADD COLUMN company_id UUID;
        END IF;
    END IF;
END $$;

