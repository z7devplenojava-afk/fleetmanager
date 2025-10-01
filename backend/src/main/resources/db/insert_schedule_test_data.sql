-- =====================================================
-- DADOS DE TESTE PARA ESCALAS
-- =====================================================

-- 1. Inserir locais de teste usando a unidade Matriz
INSERT INTO locations (id, name, address, description, unit_id, created_at, updated_at) 
SELECT gen_random_uuid(), 'Shopping Center Norte', 'Av. Paulista, 1000 - São Paulo/SP', 'Shopping center na região norte', u.id, NOW(), NOW()
FROM units u WHERE u.name = 'Matriz'
AND NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Shopping Center Norte');

INSERT INTO locations (id, name, address, description, unit_id, created_at, updated_at) 
SELECT gen_random_uuid(), 'Condomínio Park Avenue', 'Rua das Flores, 500 - São Paulo/SP', 'Condomínio residencial de alto padrão', u.id, NOW(), NOW()
FROM units u WHERE u.name = 'Matriz'
AND NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Condomínio Park Avenue');

INSERT INTO locations (id, name, address, description, unit_id, created_at, updated_at) 
SELECT gen_random_uuid(), 'Empresa ABC', 'Av. Faria Lima, 2000 - São Paulo/SP', 'Empresa de tecnologia', u.id, NOW(), NOW()
FROM units u WHERE u.name = 'Matriz'
AND NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Empresa ABC');

INSERT INTO locations (id, name, address, description, unit_id, created_at, updated_at) 
SELECT gen_random_uuid(), 'Banco XYZ', 'Rua Augusta, 300 - São Paulo/SP', 'Agência bancária central', u.id, NOW(), NOW()
FROM units u WHERE u.name = 'Matriz'
AND NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Banco XYZ');

INSERT INTO locations (id, name, address, description, unit_id, created_at, updated_at) 
SELECT gen_random_uuid(), 'Escritório Central', 'Av. Brigadeiro Faria Lima, 1500 - São Paulo/SP', 'Escritório administrativo', u.id, NOW(), NOW()
FROM units u WHERE u.name = 'Matriz'
AND NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Escritório Central');

-- 2. Inserir funcionários de teste usando usuários existentes
INSERT INTO employees (id, user_id, name, cpf, rg, birth_date, hire_date, status, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    u.id, 
    'João Silva', 
    '12345678901', 
    '123456789', 
    '1985-03-15', 
    '2024-01-15', 
    'ACTIVE', 
    NOW(), 
    NOW()
FROM users u 
WHERE u.name = 'José Mário Ramos' 
AND NOT EXISTS (SELECT 1 FROM employees WHERE cpf = '12345678901');

INSERT INTO employees (id, user_id, name, cpf, rg, birth_date, hire_date, status, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    u.id, 
    'Maria Santos', 
    '98765432109', 
    '987654321', 
    '1990-07-22', 
    '2023-08-10', 
    'ACTIVE', 
    NOW(), 
    NOW()
FROM users u 
WHERE u.name = 'José Mário Ramos' 
AND NOT EXISTS (SELECT 1 FROM employees WHERE cpf = '98765432109');

INSERT INTO employees (id, user_id, name, cpf, rg, birth_date, hire_date, status, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    u.id, 
    'Pedro Oliveira', 
    '11122233344', 
    '111222333', 
    '1988-12-05', 
    '2023-05-20', 
    'ACTIVE', 
    NOW(), 
    NOW()
FROM users u 
WHERE u.name = 'José Mário Ramos' 
AND NOT EXISTS (SELECT 1 FROM employees WHERE cpf = '11122233344');

-- CONFIRMAÇÃO
SELECT 'Dados de teste para escalas inseridos com sucesso!' as status;