-- Migration: V263__fix_remaining_uuid_columns.sql
-- Corrigir todas as colunas que ainda não foram alteradas para UUID

-- Função para alterar tipo de coluna para UUID (se existir)
CREATE OR REPLACE FUNCTION alter_column_to_uuid_if_exists(table_name text, column_name text)
RETURNS void AS $$
BEGIN
    -- Verificar se a coluna existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 
        AND column_name = $2 
        AND data_type != 'uuid'
    ) THEN
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT', table_name, column_name);
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING gen_random_uuid()', table_name, column_name);
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET DEFAULT gen_random_uuid()', table_name, column_name);
        RAISE NOTICE 'Alterado %.% para UUID', table_name, column_name;
    ELSE
        RAISE NOTICE 'Coluna %.% não existe ou já é UUID', table_name, column_name;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao alterar %.%: %', table_name, column_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Corrigir colunas que podem ter sido esquecidas
SELECT alter_column_to_uuid_if_exists('messages', 'recipient_group_id');
SELECT alter_column_to_uuid_if_exists('messages', 'sender_id');
SELECT alter_column_to_uuid_if_exists('messages', 'recipient_id');

-- Verificar e corrigir outras colunas que podem ter sido esquecidas
SELECT alter_column_to_uuid_if_exists('user_activity_logs', 'user_id');
SELECT alter_column_to_uuid_if_exists('interaction_history', 'user_id');
SELECT alter_column_to_uuid_if_exists('tasks', 'assigned_to_id');
SELECT alter_column_to_uuid_if_exists('opportunities', 'assigned_to_id');
SELECT alter_column_to_uuid_if_exists('proposals', 'created_by_id');
SELECT alter_column_to_uuid_if_exists('proposals', 'assigned_to_id');
SELECT alter_column_to_uuid_if_exists('quotes', 'created_by_id');
SELECT alter_column_to_uuid_if_exists('quotes', 'assigned_to_id');
SELECT alter_column_to_uuid_if_exists('work_posts', 'responsible_id');

-- Verificar e corrigir colunas em tabelas de relacionamento
SELECT alter_column_to_uuid_if_exists('user_permissions', 'user_id');
SELECT alter_column_to_uuid_if_exists('user_permissions', 'permission_id');

-- Remover a função
DROP FUNCTION alter_column_to_uuid_if_exists(text, text); 