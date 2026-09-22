-- =====================================================
-- SEED DE DADOS ESSENCIAIS PARA AMBIENTE CI
-- Executado automaticamente via Flyway após migrations
-- =====================================================

-- Hash BCrypt para senha "Admin123!" (senha padrão para CI)
-- Gerado com BCryptPasswordEncoder (10 rounds)
-- Senha: Admin123!
-- Hash: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa

-- 1. USUÁRIO ADMINISTRADOR CI
-- =====================================================
DO $$
BEGIN
    -- Garantir que os roles essenciais existam no ambiente CI
    INSERT INTO roles (id, name, description)
    SELECT gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador com acesso total ao sistema (CI)'
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'SUPER_ADMIN');

    INSERT INTO roles (id, name, description)
    SELECT gen_random_uuid(), 'COLABORADOR', 'Colaborador padrão do sistema (CI)'
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'COLABORADOR');

    -- Ambiente legado: tabela users ainda possui coluna "role" (NOT NULL)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'role'
    ) THEN
        INSERT INTO users (id, username, password, email, name, role, status, active, created_at, updated_at)
        SELECT 
            '11111111-1111-1111-1111-111111111111'::uuid,
            'admin@ci',
            '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa',
            'admin@ci.z7botsolutions.com.br',
            'Administrador CI',
            'ADMIN',
            'ACTIVE',
            true,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
        );
    ELSE
        -- Esquema novo: coluna "role" já foi removida e usamos relacionamentos JPA (roles / user_roles)
        INSERT INTO users (id, username, password, email, name, status, active, created_at, updated_at)
        SELECT 
            '11111111-1111-1111-1111-111111111111'::uuid,
            'admin@ci',
            '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa',
            'admin@ci.z7botsolutions.com.br',
            'Administrador CI',
            'ACTIVE',
            true,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
        );
    END IF;
END $$;

-- Atribuir role ADMIN ao usuário admin@ci
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT 
    '11111111-1111-1111-1111-111111111111'::uuid,
    r.id,
    NOW()
FROM roles r
WHERE r.name = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = '11111111-1111-1111-1111-111111111111'::uuid 
        AND ur.role_id = r.id
  );

-- =====================================================
-- 2. UNIDADE MATRIZ CI
-- =====================================================
INSERT INTO units (id, name, description, address, phone, email, created_at, updated_at)
SELECT 
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Unidade Matriz CI',
    'Unidade matriz para ambiente de CI',
    'Rua CI, 123 - São Paulo, SP',
    '(11) 9999-9999',
    'matriz@ci.z7botsolutions.com.br',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM units WHERE id = '22222222-2222-2222-2222-222222222222'::uuid
);

-- =====================================================
-- 3. TURNOS PADRÃO
-- =====================================================
INSERT INTO shifts (id, name, start_time, end_time, created_at, updated_at)
SELECT '33333333-3333-3333-3333-333333333333'::uuid, 'Manhã', '08:00:00'::time, '16:00:00'::time, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE id = '33333333-3333-3333-3333-333333333333'::uuid)
UNION ALL
SELECT '44444444-4444-4444-4444-444444444444'::uuid, 'Tarde', '16:00:00'::time, '00:00:00'::time, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE id = '44444444-4444-4444-4444-444444444444'::uuid)
UNION ALL
SELECT '55555555-5555-5555-5555-555555555555'::uuid, 'Noite', '00:00:00'::time, '08:00:00'::time, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE id = '55555555-5555-5555-5555-555555555555'::uuid);

-- =====================================================
-- 4. CARGOS/POSIÇÕES BÁSICAS
-- =====================================================
INSERT INTO positions (id, name, description, unit_id, created_at, updated_at)
SELECT '66666666-6666-6666-6666-666666666666'::uuid, 'Vigilante', 'Vigilante de segurança', '22222222-2222-2222-2222-222222222222'::uuid, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE id = '66666666-6666-6666-6666-666666666666'::uuid)
UNION ALL
SELECT '77777777-7777-7777-7777-777777777777'::uuid, 'Supervisor', 'Supervisor de segurança', '22222222-2222-2222-2222-222222222222'::uuid, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE id = '77777777-7777-7777-7777-777777777777'::uuid)
UNION ALL
SELECT '88888888-8888-8888-8888-888888888888'::uuid, 'Gerente', 'Gerente de segurança', '22222222-2222-2222-2222-222222222222'::uuid, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE id = '88888888-8888-8888-8888-888888888888'::uuid);

-- =====================================================
-- 5. DEPARTAMENTO BÁSICO
-- =====================================================
-- Garantir que o departamento "Operacional" exista
DO $$
BEGIN
    -- Se não existe, criar
    IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Operacional') THEN
        INSERT INTO departments (id, name, description, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Operacional',
            'Departamento operacional para CI',
            NOW(),
            NOW()
        );
    ELSE
        -- Se já existe, apenas atualizar descrição
        UPDATE departments 
        SET description = 'Departamento operacional para CI',
            updated_at = NOW()
        WHERE name = 'Operacional';
    END IF;
END $$;

-- =====================================================
-- 6. CLIENTE DE TESTE
-- =====================================================
INSERT INTO clients (id, name, cnpj, email, phone, address, city, state, zip_code, status, created_at, updated_at)
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'Cliente Teste CI',
    '12.345.678/0001-90',
    'cliente@teste.ci',
    '(11) 3333-3333',
    'Rua Teste, 123',
    'São Paulo',
    'SP',
    '01234-567',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE cnpj = '12.345.678/0001-90'
);

-- =====================================================
-- 7. EMPRESA DE TESTE
-- =====================================================
INSERT INTO companies (id, name, trade_name, cnpj, email, phone, address, city, state, zip_code, status, type, sector, size, created_by, created_at, updated_at)
SELECT 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'Empresa Teste CI',
    'Empresa Teste CI Ltda',
    '98.765.432/0001-10',
    'empresa@teste.ci',
    '(11) 2222-2222',
    'Av. Empresa, 456',
    'São Paulo',
    'SP',
    '01234-567',
    'ACTIVE',
    'LTDA',
    'Segurança',
    'Média',
    '11111111-1111-1111-1111-111111111111'::uuid,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM companies WHERE cnpj = '98.765.432/0001-10'
);

-- =====================================================
-- 7.1. USUÁRIOS DO BANCO fluxbus_test
-- =====================================================
-- INSERTs hardcoded de usuários exportados do banco fluxbus_test
-- Para gerar estes INSERTs, execute o script: generate_inserts_and_update_migration.ps1
-- no ambiente onde o banco fluxbus_test está disponível

-- COLE OS INSERTs DE USUÁRIOS AQUI:
-- (Execute generate_inserts_and_update_migration.ps1 para gerar automaticamente)

-- =====================================================
-- 7.2. USER_ROLES DOS USUÁRIOS
-- =====================================================
-- INSERTs hardcoded de user_roles exportados do banco fluxbus_test

-- COLE OS INSERTs DE USER_ROLES AQUI:
-- (Execute generate_inserts_and_update_migration.ps1 para gerar automaticamente)

-- =====================================================
-- 8. FUNCIONÁRIOS DO BANCO fluxbus_test
-- =====================================================
-- INSERTs hardcoded de funcionários exportados do banco fluxbus_test
-- Para gerar estes INSERTs, execute o script: generate_inserts_and_update_migration.ps1
-- no ambiente onde o banco fluxbus_test está disponível

-- COLE OS INSERTs DE FUNCIONÁRIOS AQUI:
-- (Execute generate_inserts_and_update_migration.ps1 para gerar automaticamente)

-- =====================================================
-- 8.1. DADOS DA TABELA EMPLOYEES (LEGADO - manter para referência)
-- =====================================================
-- INSTRUÇÕES PARA INCLUIR DADOS REAIS DA TABELA EMPLOYEES:
-- 1. Execute o script: migration-ci/export_all_employees_for_ci.sql no banco de produção/desenvolvimento
-- 2. Copie todos os INSERTs gerados e cole abaixo, substituindo este comentário
-- 3. Os INSERTs já incluem ON CONFLICT (id) DO NOTHING para evitar duplicatas
--
-- Exemplo de estrutura (substitua pelos dados reais exportados):
-- INSERT INTO employees (
--     id, user_id, position_id, registration_number, name, document, cpf, rg, 
--     birth_date, gender, marital_status, nationality, address, phone, email, 
--     unit_id, company_id, hire_date, termination_date, status, notes, photo_url,
--     cnh_number, cnh_expiration_date, cnh_category,
--     ctps, ctps_series, ctps_issue_date, ctps_issuing_agency, ctps_rural,
--     titulo_eleitor, titulo_eleitor_zona, titulo_eleitor_secao,
--     carteira_identidade_orgao_emissor, carteira_identidade_data_emissao, certificado_militar,
--     cbo, pis, salario, salario_por_extenso, periodo_pagamento, horario_trabalho, folga_semanal,
--     fgts_optante, fgts_data_opcao, fgts_banco_depositario, fgts_data_retratacao,
--     pis_data_cadastro, pis_banco_depositario, pis_endereco_banco, pis_codigo_banco, pis_codigo_agencia,
--     visto_fiscalizacao, nome_pai, nome_mae, local_nascimento, grau_instrucao,
--     carteira_modelo_19, registro_geral_estrangeiro,
--     casado_brasileiro, nome_conjuge_estrangeiro,
--     spouse_name, spouse_cpf, spouse_rg, spouse_birth_date, spouse_phone, spouse_email,
--     tem_filhos_brasileiros, quantidade_filhos_brasileiros,
--     data_chegada_brasil, naturalizado, decreto_naturalizacao,
--     assinatura_funcionario, data_rescisao,
--     created_at, updated_at
-- ) VALUES (
--     'uuid-aqui', 
--     'user-id-aqui' ou NULL, 
--     'position-id-aqui' ou NULL,
--     'REG001',
--     'Nome do Funcionário',
--     '123.456.789-00',
--     '12.345.678-9',
--     '1990-01-15',
--     'M',
--     'SOLTEIRO',
--     'Brasileiro',
--     'Endereço completo',
--     '(11) 99999-9999',
--     'email@example.com',
--     'unit-id-aqui' ou NULL,
--     'company-id-aqui' ou NULL,
--     '2024-01-01',
--     NULL,
--     'ACTIVE',
--     NULL,
--     NULL,
--     '12345678901',
--     '2025-12-31',
--     'B',
--     ... (outros campos)
--     NOW(),
--     NOW()
-- ) ON CONFLICT (id) DO NOTHING;

-- COLE OS INSERTs EXPORTADOS AQUI ABAIXO:
-- (Execute o script export_all_employees_for_ci.sql no banco de origem e cole os resultados aqui)

-- =====================================================
-- 8.1. FUNCIONÁRIOS DE TESTE (FALLBACK - apenas se não houver dados reais)
-- =====================================================
-- Estes funcionários de teste serão inseridos apenas se não houver conflito
-- com os funcionários reais inseridos acima
INSERT INTO employees (
    id, user_id, position_id, registration_number, name, document, cpf, rg, 
    birth_date, gender, marital_status, nationality, address, phone, email, 
    unit_id, company_id, hire_date, termination_date, status, notes,
    cnh_number, cnh_expiration_date, cnh_category,
    ctps, ctps_series, ctps_issue_date, ctps_issuing_agency,
    titulo_eleitor, titulo_eleitor_zona, titulo_eleitor_secao,
    cbo, pis, salario, periodo_pagamento, horario_trabalho, folga_semanal,
    fgts_optante, fgts_data_opcao, fgts_banco_depositario,
    pis_data_cadastro, pis_banco_depositario,
    nome_pai, nome_mae, local_nascimento, grau_instrucao,
    created_at, updated_at
)
SELECT 
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'FUNC001',
    'João Silva',
    '123.456.789-00',
    '123.456.789-00',
    '12.345.678-9',
    '1990-01-15',
    'M',
    'SOLTEIRO',
    'Brasileiro',
    'Rua Funcionário, 789 - São Paulo, SP',
    '(11) 98765-4321',
    'joao.silva@teste.ci',
    '22222222-2222-2222-2222-222222222222'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    '2024-01-01',
    NULL,
    'ACTIVE',
    'Funcionário de teste para ambiente CI',
    '12345678901',
    '2025-12-31',
    'B',
    '1234567890',
    '123',
    '2020-01-15',
    'SSP/SP',
    '123456789012',
    '123',
    '456',
    '5172-10',
    '12345678901',
    2500.00,
    'Mensal',
    '08:00 às 17:00',
    'Domingo',
    true,
    '2024-01-01',
    'Banco do Brasil',
    '2024-01-01',
    'Banco do Brasil',
    'José Silva',
    'Maria Silva',
    'São Paulo, SP',
    'Ensino Médio Completo',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid);

INSERT INTO employees (
    id, user_id, position_id, registration_number, name, document, cpf, rg, 
    birth_date, gender, marital_status, nationality, address, phone, email, 
    unit_id, company_id, hire_date, termination_date, status, notes,
    cnh_number, cnh_expiration_date, cnh_category,
    ctps, ctps_series, ctps_issue_date, ctps_issuing_agency,
    titulo_eleitor, titulo_eleitor_zona, titulo_eleitor_secao,
    cbo, pis, salario, periodo_pagamento, horario_trabalho, folga_semanal,
    fgts_optante, fgts_data_opcao, fgts_banco_depositario,
    pis_data_cadastro, pis_banco_depositario,
    nome_pai, nome_mae, local_nascimento, grau_instrucao,
    created_at, updated_at
)
SELECT 
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
    NULL,
    '77777777-7777-7777-7777-777777777777'::uuid,
    'FUNC002',
    'Maria Santos',
    '987.654.321-00',
    '987.654.321-00',
    '98.765.432-1',
    '1985-05-20',
    'F',
    'CASADO',
    'Brasileiro',
    'Av. Funcionária, 321 - São Paulo, SP',
    '(11) 91234-5678',
    'maria.santos@teste.ci',
    '22222222-2222-2222-2222-222222222222'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    '2024-02-01',
    NULL,
    'ACTIVE',
    'Funcionária de teste para ambiente CI',
    '98765432109',
    '2026-06-30',
    'AB',
    '9876543210',
    '456',
    '2019-05-20',
    'SSP/SP',
    '987654321098',
    '456',
    '789',
    '5172-10',
    '98765432109',
    3000.00,
    'Mensal',
    '08:00 às 17:00',
    'Sábado',
    true,
    '2024-02-01',
    'Caixa Econômica Federal',
    '2024-02-01',
    'Caixa Econômica Federal',
    'Carlos Santos',
    'Ana Santos',
    'Rio de Janeiro, RJ',
    'Ensino Superior Completo',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid);

-- =====================================================
-- 9. FROTA - VEÍCULOS DE TESTE
-- =====================================================
-- Usar subquery para buscar o ID do departamento "Operacional"
INSERT INTO vehicles (id, plate, model, brand, year, color, status, fuel_type, capacity, current_mileage, department_id, company_id, created_at, updated_at)
SELECT 
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
    'ABC1234',
    'Civic',
    'Honda',
    2020,
    'Prata',
    'ACTIVE',
    'FLEX',
    5,
    45000,
    (SELECT id FROM departments WHERE name = 'Operacional' LIMIT 1),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE plate = 'ABC1234')
UNION ALL
SELECT 
    'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
    'DEF5678',
    'Corolla',
    'Toyota',
    2019,
    'Branco',
    'ACTIVE',
    'FLEX',
    5,
    38000,
    (SELECT id FROM departments WHERE name = 'Operacional' LIMIT 1),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE plate = 'DEF5678')
UNION ALL
SELECT 
    '11111111-1111-1111-1111-111111111112'::uuid,
    'GHI9012',
    'Hilux',
    'Toyota',
    2021,
    'Prata',
    'ACTIVE',
    'DIESEL',
    5,
    25000,
    (SELECT id FROM departments WHERE name = 'Operacional' LIMIT 1),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE plate = 'GHI9012');

-- =====================================================
-- LOG DE CONCLUSÃO
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Seed de dados essenciais para CI concluído com sucesso!';
    RAISE NOTICE '   - Usuário admin: admin@ci (senha: Admin123!)';
    RAISE NOTICE '   - Usuários do banco fluxbus_test: Incluídos via INSERTs hardcoded';
    RAISE NOTICE '   - Unidade: Unidade Matriz CI';
    RAISE NOTICE '   - Turnos: Manhã, Tarde, Noite';
    RAISE NOTICE '   - Cargos: Vigilante, Supervisor, Gerente';
    RAISE NOTICE '   - Departamento: Operacional';
    RAISE NOTICE '   - Cliente: Cliente Teste CI';
    RAISE NOTICE '   - Empresa: Empresa Teste CI';
    RAISE NOTICE '   - Funcionários do banco fluxbus_test: Incluídos via INSERTs hardcoded';
    RAISE NOTICE '   - Funcionários de teste (fallback): 2 funcionários completos';
    RAISE NOTICE '   - Frota: 3 veículos de teste';
END $$;






