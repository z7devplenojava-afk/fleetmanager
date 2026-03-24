-- Adiciona colunas necessárias na tabela companies usadas pelo serviço (sigla, description, website, status)
-- De forma idempotente, para não falhar em ambientes já migrados

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'sigla'
    ) THEN
        ALTER TABLE companies ADD COLUMN sigla VARCHAR(20);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'description'
    ) THEN
        ALTER TABLE companies ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'website'
    ) THEN
        ALTER TABLE companies ADD COLUMN website VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'status'
    ) THEN
        ALTER TABLE companies ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
    END IF;
END $$;

-- Índice único condicional para sigla (ignora valores nulos)
CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_sigla ON companies(sigla) WHERE sigla IS NOT NULL;

