-- Script simples para exportar todos os funcionários
-- Execute no PostgreSQL e copie o resultado para a migration V371__seed_all_employees.sql

-- Opção 1: Exportar como COPY (formato CSV)
\copy (SELECT * FROM employees ORDER BY name) TO 'employees_export.csv' WITH CSV HEADER;

-- Opção 2: Gerar INSERTs básicos (execute e copie o resultado)
SELECT 
    'INSERT INTO employees (id, user_id, position_id, registration_number, name, cpf, rg, birth_date, marital_status, address, phone, email, unit_id, company_id, hire_date, status, created_at, updated_at) VALUES (' ||
    '''' || id || ''', ' ||
    COALESCE('''' || user_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || position_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(registration_number, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(cpf, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(rg, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || birth_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(marital_status, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(address, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(phone, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(email, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || unit_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || company_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || hire_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || status || '''', '''ACTIVE''') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NOW()') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NOW()') ||
    ');' as insert_statement
FROM employees
ORDER BY name;















