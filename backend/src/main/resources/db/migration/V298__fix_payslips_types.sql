-- Migration para corrigir os tipos dos campos month e year na tabela payslips
-- Alterando de VARCHAR para INTEGER para resolver incompatibilidade de tipos SQL

DO $$
BEGIN
    -- Verificar se a tabela payslips existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payslips') THEN
        
        -- Corrigir o campo month se for VARCHAR
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payslips' 
            AND column_name = 'month' 
            AND data_type = 'character varying'
        ) THEN
            -- Alterar o tipo do campo month para INTEGER
            ALTER TABLE payslips ALTER COLUMN month TYPE INTEGER USING month::integer;
            RAISE NOTICE 'Campo month alterado de VARCHAR para INTEGER';
        ELSE
            RAISE NOTICE 'Campo month já é INTEGER';
        END IF;
        
        -- Corrigir o campo year se for VARCHAR
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payslips' 
            AND column_name = 'year' 
            AND data_type = 'character varying'
        ) THEN
            -- Alterar o tipo do campo year para INTEGER
            ALTER TABLE payslips ALTER COLUMN year TYPE INTEGER USING year::integer;
            RAISE NOTICE 'Campo year alterado de VARCHAR para INTEGER';
        ELSE
            RAISE NOTICE 'Campo year já é INTEGER';
        END IF;
        
    ELSE
        RAISE NOTICE 'Tabela payslips não existe';
    END IF;
END $$;

