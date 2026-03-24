-- Criar tabela para EPIs padrão da primeira entrega por empresa
CREATE TABLE IF NOT EXISTS company_default_epis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    epi_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    ca_number VARCHAR(50),
    validity VARCHAR(100),
    observations TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar foreign key de forma segura (verificando se companies existe e tem PK)
DO $$
BEGIN
    -- Verifica se a tabela companies existe
    IF EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = 'public' 
            AND tablename = 'companies'
    ) THEN
        -- Tenta adicionar a foreign key (será ignorada se já existir ou se houver erro)
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_constraint 
                WHERE conname = 'fk_company_default_epis_company'
            ) THEN
                ALTER TABLE company_default_epis 
                ADD CONSTRAINT fk_company_default_epis_company 
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Se houver erro (ex: constraint não encontrada), apenas registra e continua
                RAISE NOTICE 'Não foi possível criar foreign key para companies(id): %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Tabela companies não encontrada. Foreign key não será criada.';
    END IF;
END $$;

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_company_default_epis_company_id ON company_default_epis(company_id);
CREATE INDEX IF NOT EXISTS idx_company_default_epis_order ON company_default_epis(company_id, order_index);


