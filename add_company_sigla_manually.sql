-- Adicionar coluna company_sigla manualmente na tabela invoices
-- Execute este script diretamente no PostgreSQL

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'company_sigla'
    ) THEN
        -- Adicionar a coluna se não existir
        ALTER TABLE invoices ADD COLUMN company_sigla VARCHAR(10);
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_invoices_company_sigla ON invoices(company_sigla);
        
        RAISE NOTICE 'Coluna company_sigla adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna company_sigla já existe na tabela invoices.';
    END IF;
END $$;
