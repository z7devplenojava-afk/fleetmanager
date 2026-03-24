-- Migration: V261__remove_all_foreign_keys.sql
-- Remove TODAS as chaves estrangeiras do banco de dados
-- Esta migration é necessária para permitir a alteração dos tipos de ID

-- Função para remover todas as chaves estrangeiras
CREATE OR REPLACE FUNCTION drop_all_foreign_keys()
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    -- Loop através de todas as chaves estrangeiras
    FOR r IN (
        SELECT 
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Removida FK: % em %', r.constraint_name, r.table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função
SELECT drop_all_foreign_keys();

-- Remover a função
DROP FUNCTION drop_all_foreign_keys(); 