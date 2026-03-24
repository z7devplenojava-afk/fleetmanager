-- Migration: V262__alter_all_ids_to_uuid.sql
-- Alterar todos os tipos de ID de BIGSERIAL para UUID
-- Esta migration assume que todas as FKs já foram removidas

-- Função para alterar tipo de coluna para UUID
CREATE OR REPLACE FUNCTION alter_column_to_uuid(table_name text, column_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT', table_name, column_name);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING gen_random_uuid()', table_name, column_name);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET DEFAULT gen_random_uuid()', table_name, column_name);
    RAISE NOTICE 'Alterado %.% para UUID', table_name, column_name;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao alterar %.%: %', table_name, column_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Alterar todas as colunas de ID para UUID
SELECT alter_column_to_uuid('clients', 'id');
SELECT alter_column_to_uuid('users', 'id');
SELECT alter_column_to_uuid('suppliers', 'id');
SELECT alter_column_to_uuid('work_posts', 'id');
SELECT alter_column_to_uuid('orders_of_service', 'id');
SELECT alter_column_to_uuid('invoices', 'id');
SELECT alter_column_to_uuid('quotes', 'id');
SELECT alter_column_to_uuid('quote_items', 'id');
SELECT alter_column_to_uuid('proposals', 'id');
SELECT alter_column_to_uuid('proposal_items', 'id');
SELECT alter_column_to_uuid('contracts', 'id');
SELECT alter_column_to_uuid('leads', 'id');
SELECT alter_column_to_uuid('opportunities', 'id');
SELECT alter_column_to_uuid('messages', 'id');
SELECT alter_column_to_uuid('tasks', 'id');
SELECT alter_column_to_uuid('kanban_status', 'id');
SELECT alter_column_to_uuid('interaction_history', 'id');
SELECT alter_column_to_uuid('user_activity_logs', 'id');
SELECT alter_column_to_uuid('user_groups', 'id');

-- Alterar todas as colunas de chave estrangeira para UUID
SELECT alter_column_to_uuid('contracts', 'client_id');
SELECT alter_column_to_uuid('units', 'client_id');
SELECT alter_column_to_uuid('work_posts', 'client_id');
SELECT alter_column_to_uuid('work_posts', 'contract_id');
SELECT alter_column_to_uuid('invoices', 'client_id');
SELECT alter_column_to_uuid('invoices', 'contract_id');
SELECT alter_column_to_uuid('invoices', 'supplier_id');
SELECT alter_column_to_uuid('invoices', 'unit_id');
SELECT alter_column_to_uuid('quotes', 'client_id');
SELECT alter_column_to_uuid('quotes', 'lead_id');
SELECT alter_column_to_uuid('quote_items', 'quote_id');
SELECT alter_column_to_uuid('proposals', 'client_id');
SELECT alter_column_to_uuid('proposals', 'lead_id');
SELECT alter_column_to_uuid('proposal_items', 'proposal_id');
SELECT alter_column_to_uuid('opportunities', 'client_id');
SELECT alter_column_to_uuid('opportunities', 'lead_id');
SELECT alter_column_to_uuid('opportunities', 'status_id');
SELECT alter_column_to_uuid('tasks', 'opportunity_id');
SELECT alter_column_to_uuid('interaction_history', 'opportunity_id');

-- Remover a função
DROP FUNCTION alter_column_to_uuid(text, text); 