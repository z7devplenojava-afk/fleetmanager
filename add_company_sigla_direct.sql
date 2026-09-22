-- Script para adicionar coluna company_sigla na tabela invoices
-- Execute este script diretamente no banco fluxbus_test

-- Conectar ao banco: fluxbus_test
-- Usuário: postgres
-- Senha: 1234567

-- Adicionar coluna company_sigla se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'company_sigla'
    ) THEN
        ALTER TABLE invoices ADD COLUMN company_sigla VARCHAR(10);
        CREATE INDEX IF NOT EXISTS idx_invoices_company_sigla ON invoices(company_sigla);
        RAISE NOTICE 'Coluna company_sigla adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna company_sigla já existe na tabela invoices.';
    END IF;
END $$;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name = 'company_sigla';
