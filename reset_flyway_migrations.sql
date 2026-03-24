-- Script para resetar o histórico de migrações do Flyway
-- ATENÇÃO: Este script vai dropar TODAS as tabelas e recriar do zero
-- Use apenas em ambiente de desenvolvimento!

-- Dropar todas as tabelas que dependem de outras (foreign keys primeiro)
DROP TABLE IF EXISTS vehicle_maintenances CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS fuel_records CASCADE;
DROP TABLE IF EXISTS mileage_records CASCADE;
DROP TABLE IF EXISTS km_controls CASCADE;
DROP TABLE IF EXISTS work_post_epis CASCADE;
DROP TABLE IF EXISTS work_post_trainings CASCADE;
DROP TABLE IF EXISTS work_post_equipment CASCADE;
DROP TABLE IF EXISTS work_posts CASCADE;
DROP TABLE IF EXISTS equipment_movements CASCADE;
DROP TABLE IF EXISTS equipments CASCADE;
DROP TABLE IF EXISTS employee_assignments CASCADE;
DROP TABLE IF EXISTS purchase_request_items CASCADE;
DROP TABLE IF EXISTS purchase_requests CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS product_variations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS measurement_items CASCADE;
DROP TABLE IF EXISTS measurements CASCADE;
DROP TABLE IF EXISTS service_items CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS scheduled_payments CASCADE;
DROP TABLE IF EXISTS payment_receipts CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS bank_reconciliations CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS file_system_items CASCADE;
DROP TABLE IF EXISTS unified_documents CASCADE;
DROP TABLE IF EXISTS document_signatures CASCADE;
DROP TABLE IF EXISTS operational_occurrences CASCADE;
DROP TABLE IF EXISTS work_schedules CASCADE;
DROP TABLE IF EXISTS visit_schedules CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS activity_reports CASCADE;
DROP TABLE IF EXISTS rota_postos CASCADE;
DROP TABLE IF EXISTS rotas CASCADE;
DROP TABLE IF EXISTS postos CASCADE;
DROP TABLE IF EXISTS shift_change_forms CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS vacations CASCADE;
DROP TABLE IF EXISTS overtime CASCADE;
DROP TABLE IF EXISTS payslips CASCADE;
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS time_records CASCADE;
DROP TABLE IF EXISTS facial_embeddings CASCADE;
DROP TABLE IF EXISTS job_candidates CASCADE;
DROP TABLE IF EXISTS job_vacancies CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_group_membership CASCADE;
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cost_centers CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS company_configs CASCADE;
DROP TABLE IF EXISTS fuel_stations CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS crm_kanban_items CASCADE;
DROP TABLE IF EXISTS crm_kanban_boards CASCADE;
DROP TABLE IF EXISTS document_models CASCADE;
DROP TABLE IF EXISTS sst_exams CASCADE;
DROP TABLE IF EXISTS sst_trainings CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS system_notifications CASCADE;

-- Limpar histórico do Flyway
DROP TABLE IF EXISTS flyway_schema_history CASCADE;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados resetado com sucesso!';
    RAISE NOTICE 'Execute o backend para que o Flyway recrie todas as tabelas.';
END $$;

