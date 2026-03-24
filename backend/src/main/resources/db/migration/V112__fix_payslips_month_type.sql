-- Migration para corrigir o tipo do campo month na tabela payslips
-- Alterando de VARCHAR para INTEGER para resolver incompatibilidade de tipos

-- Verificar se a tabela existe e se o campo month é VARCHAR
DO $$
BEGIN
    -- Verificar se a tabela payslips existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payslips') THEN
        -- Verificar se o campo month é VARCHAR
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payslips' 
            AND column_name = 'month' 
            AND data_type = 'character varying'
        ) THEN
            -- Alterar o tipo do campo month para INTEGER
            ALTER TABLE payslips ALTER COLUMN month TYPE INTEGER USING month::integer;
            
            RAISE NOTICE 'Campo month alterado com sucesso de VARCHAR para INTEGER';
        ELSE
            RAISE NOTICE 'Campo month já é INTEGER ou não existe';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela payslips não existe';
    END IF;
END $$;
