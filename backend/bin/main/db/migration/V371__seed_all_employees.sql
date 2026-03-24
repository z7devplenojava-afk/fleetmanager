-- Migration: V371__seed_all_employees.sql
-- Seed com todos os funcionários cadastrados no banco
-- 
-- INSTRUÇÕES:
-- 1. Execute o script export_employees_simple.sql no PostgreSQL
-- 2. Copie os INSERTs gerados e cole abaixo, substituindo este comentário
-- 3. Certifique-se de que os IDs não conflitem com dados existentes
-- 4. Use ON CONFLICT DO NOTHING para evitar erros se os dados já existirem

-- Exemplo de estrutura (substitua pelos dados reais exportados):
-- INSERT INTO employees (
--     id, user_id, position_id, registration_number, name, cpf, rg, 
--     birth_date, marital_status, address, phone, email, 
--     unit_id, company_id, hire_date, status, 
--     cnh_number, cnh_expiration_date, cnh_category,
--     whatsapp, created_at, updated_at
-- ) VALUES
-- (
--     'uuid-aqui', 
--     'user-id-aqui' ou NULL, 
--     'position-id-aqui' ou NULL,
--     'REG001',
--     'Nome do Funcionário',
--     '123.456.789-00',
--     '12.345.678-9',
--     '1990-01-15',
--     'SOLTEIRO',
--     'Endereço completo',
--     '(11) 99999-9999',
--     'email@example.com',
--     'unit-id-aqui' ou NULL,
--     'company-id-aqui' ou NULL,
--     '2024-01-01',
--     'ACTIVE',
--     '12345678901',
--     '2025-12-31',
--     'B',
--     '(11) 99999-9999',
--     NOW(),
--     NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- COLE OS INSERTs EXPORTADOS AQUI ABAIXO:

-- TODO: Cole aqui os INSERTs gerados pelo script export_employees_simple.sql















