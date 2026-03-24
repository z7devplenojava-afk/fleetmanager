-- Script para criar dados de teste para o sistema de envio de holerites
-- Execute este script no banco de dados PostgreSQL

-- 1. Inserir funcionário de teste
INSERT INTO employees (id, name, document, email, phone, status, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'João Silva Teste',
    '12345678901',
    'joao.teste@empresa.com',
    '31999999999',
    'ACTIVE',
    NOW(),
    NOW()
) ON CONFLICT (document) DO NOTHING;

-- 2. Inserir usuário correspondente para WhatsApp
INSERT INTO users (id, username, email, name, password, whatsapp, status, active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    '12345678901',
    'colaborador.12345678901@promovervigilancia.com.br',
    'João Silva Teste',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    '5531999999999',
    'ACTIVE',
    true,
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- 3. Inserir holerite de teste
INSERT INTO payslips (id, employee_name, cpf, month, year, file_name, status, processed_at, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'João Silva Teste',
    '12345678901',
    10,
    2025,
    'joao_silva_teste_12345678901_10_2025.pdf',
    'PROCESSED',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 4. Inserir logs de envio de teste
INSERT INTO payslip_delivery_logs (id, cpf, month, year, channel, success, attempts, error_message, created_at, updated_at)
VALUES 
    (gen_random_uuid(), '12345678901', 10, 2025, 'WHATSAPP', true, 1, null, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
    (gen_random_uuid(), '12345678901', 10, 2025, 'EMAIL', false, 1, 'Email não cadastrado', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
    (gen_random_uuid(), '12345678901', 9, 2025, 'WHATSAPP', true, 1, null, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');

-- 5. Verificar dados inseridos
SELECT 'Funcionários inseridos:' as info, COUNT(*) as count FROM employees WHERE document = '12345678901'
UNION ALL
SELECT 'Usuários inseridos:', COUNT(*) FROM users WHERE username = '12345678901'
UNION ALL
SELECT 'Holerites inseridos:', COUNT(*) FROM payslips WHERE cpf = '12345678901'
UNION ALL
SELECT 'Logs inseridos:', COUNT(*) FROM payslip_delivery_logs WHERE cpf = '12345678901';

-- 6. Mostrar dados de teste
SELECT 
    'DADOS DE TESTE CRIADOS:' as titulo,
    '' as separador;

SELECT 
    'FUNCIONÁRIO' as tipo,
    e.name as nome,
    e.document as cpf,
    e.email,
    e.phone as telefone
FROM employees e 
WHERE e.document = '12345678901'

UNION ALL

SELECT 
    'USUÁRIO' as tipo,
    u.name as nome,
    u.username as cpf,
    u.email,
    u.whatsapp as telefone
FROM users u 
WHERE u.username = '12345678901'

UNION ALL

SELECT 
    'HOLERITE' as tipo,
    p.employee_name as nome,
    p.cpf,
    p.file_name as email,
    CONCAT(p.month, '/', p.year) as telefone
FROM payslips p 
WHERE p.cpf = '12345678901'

UNION ALL

SELECT 
    'LOG' as tipo,
    CONCAT(pdl.channel, ' - ', CASE WHEN pdl.success THEN 'Sucesso' ELSE 'Falha' END) as nome,
    pdl.cpf,
    pdl.error_message as email,
    CONCAT(pdl.month, '/', pdl.year) as telefone
FROM payslip_delivery_logs pdl 
WHERE pdl.cpf = '12345678901'
ORDER BY tipo, nome;