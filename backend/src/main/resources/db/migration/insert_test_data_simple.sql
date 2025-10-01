-- =====================================================
-- SCRIPT SIMPLIFICADO PARA DADOS DE TESTE
-- MÓDULO OPERACIONAL - VERSÃO RÁPIDA
-- =====================================================

-- 1. Inserir departamento básico
INSERT INTO departments (id, name, description, created_at, updated_at) 
VALUES (gen_random_uuid(), 'Operacional', 'Departamento operacional', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. Inserir cliente básico
INSERT INTO clients (id, name, cnpj, email, phone, address, city, state, zip_code, status, created_at, updated_at) 
VALUES (gen_random_uuid(), 'Cliente Teste', '12.345.678/0001-90', 'teste@cliente.com', '(11) 3333-3333', 'Rua Teste, 123', 'São Paulo', 'SP', '01234-567', 'ACTIVE', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 3. Inserir unidade básica
INSERT INTO units (id, name, description, address, phone, email, created_at, updated_at) 
VALUES (gen_random_uuid(), 'Unidade Teste', 'Unidade para testes', 'Rua Teste, 100', '(11) 4444-4444', 'teste@unidade.com', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 4. Inserir posições básicas
INSERT INTO positions (id, name, description, unit_id, created_at, updated_at) 
SELECT 
    gen_random_uuid(), 
    'Vigilante', 
    'Vigilante de segurança', 
    u.id, 
    NOW(), 
    NOW()
FROM units u WHERE u.name = 'Unidade Teste'
UNION ALL
SELECT 
    gen_random_uuid(), 
    'Supervisor', 
    'Supervisor de segurança', 
    u.id, 
    NOW(), 
    NOW()
FROM units u WHERE u.name = 'Unidade Teste';

-- 5. Inserir funcionários básicos
INSERT INTO employees (id, user_id, position_id, registration_number, name, cpf, rg, birth_date, marital_status, address, phone, email, hire_date, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM users LIMIT 1),
    p.id,
    'EMP001',
    'João Silva',
    '12345678901',
    '123456789',
    '1985-03-15',
    'MARRIED',
    'Rua Teste, 100',
    '(11) 99999-9999',
    'joao@teste.com',
    '2024-01-15',
    'ACTIVE',
    NOW(),
    NOW()
FROM positions p WHERE p.name = 'Vigilante'
UNION ALL
SELECT 
    gen_random_uuid(),
    (SELECT id FROM users LIMIT 1),
    p.id,
    'EMP002',
    'Maria Santos',
    '98765432109',
    '987654321',
    '1990-07-22',
    'SINGLE',
    'Av. Teste, 200',
    '(11) 88888-8888',
    'maria@teste.com',
    '2023-08-10',
    'ACTIVE',
    NOW(),
    NOW()
FROM positions p WHERE p.name = 'Supervisor';

-- 6. Inserir postos básicos
INSERT INTO work_posts (id, post_code, name, description, type, status, address, city, state, zip_code, client_id, required_vigilantes, work_schedule, shift_start, shift_end, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'POSTO-TESTE-001',
    'Posto Teste A',
    'Posto de teste para operacional',
    'POSTO_8H_DIURNO',
    'ATIVO',
    'Rua Teste, 300',
    'São Paulo',
    'SP',
    '01234-800',
    c.id,
    2,
    'DIURNO',
    '06:00:00',
    '14:00:00',
    NOW(),
    NOW()
FROM clients c WHERE c.name = 'Cliente Teste';

-- 7. Inserir notificação básica
INSERT INTO system_notifications (id, type, title, description, priority, timestamp, read, recipient_id, employee_name, department, created_at) 
VALUES (
    gen_random_uuid(),
    'OCORRENCIA',
    'Teste de notificação',
    'Notificação de teste para o módulo operacional',
    'MEDIA',
    NOW(),
    false,
    (SELECT id FROM users LIMIT 1),
    'João Silva',
    'OPERACIONAL',
    NOW()
);

-- 8. Inserir ocorrência básica
INSERT INTO operational_occurrences (id, type, title, description, employee_id, location, status, priority, date, responsible, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'SEGURANCA',
    'Ocorrência de teste',
    'Ocorrência de teste para validação',
    e.id,
    'Posto Teste A',
    'PENDENTE',
    'MEDIA',
    NOW(),
    'João Silva',
    NOW(),
    NOW()
FROM employees e WHERE e.name = 'João Silva';

-- 9. Inserir escala básica
INSERT INTO work_schedules (id, employee_id, location_id, schedule_date, shift, status, observations, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    e.id,
    wp.id,
    CURRENT_DATE + INTERVAL '1 day',
    'DAY',
    'PENDING',
    'Escala de teste',
    NOW(),
    NOW()
FROM employees e, work_posts wp 
WHERE e.name = 'João Silva' AND wp.name = 'Posto Teste A';

-- 10. Inserir mensagem básica
INSERT INTO messages (id, title, content, type, sender_id, status, priority, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Mensagem de teste',
    'Mensagem de teste para o módulo operacional',
    'GLOBAL',
    (SELECT id FROM users LIMIT 1),
    'UNREAD',
    'NORMAL',
    NOW(),
    NOW()
);

-- CONFIRMAÇÃO
SELECT 'Dados de teste inseridos com sucesso!' as status;
