-- Migration V4659: Cadastrar roles SST e SEGURANCA_DO_TRABALHO e ampliar permissões do AUXILIAR_ADMINISTRATIVO

-- 1. Inserir roles de SST
INSERT INTO roles (id, name, description)
VALUES 
    (gen_random_uuid(), 'SST', 'Segurança do Trabalho - Gestão de SST, RH e Departamento Pessoal'),
    (gen_random_uuid(), 'SEGURANCA_DO_TRABALHO', 'Segurança do Trabalho - Gestão de SST, RH e Departamento Pessoal')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- 2. Garantir permissões de SST, RH e Departamento Pessoal para as roles de SST
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('SST', 'SEGURANCA_DO_TRABALHO')
  AND p.name IN (
    'DASHBOARD_READ',
    'PROFILE_READ',
    'PROFILE_WRITE',
    'MESSAGES_READ',
    'MESSAGES_WRITE',
    'MESSAGES_CREATE',
    'EMPLOYEES_READ',
    'EMPLOYEES_WRITE',
    'EMPLOYEES_CREATE',
    'PAYSLIPS_READ',
    'PAYSLIPS_WRITE',
    'TIME_RECORD_READ',
    'TIME_RECORD_WRITE',
    'EQUIPMENTS_READ',
    'EQUIPMENTS_WRITE',
    'STOCK_READ',
    'REPORTS_READ',
    'REPORTS_GENERATE'
  )
ON CONFLICT DO NOTHING;

-- 3. Ampliar permissões do AUXILIAR_ADMINISTRATIVO (Cadastro de Despesas, Criação de OS, Abastecimento e Parte Diária)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('AUXILIAR_ADMINISTRATIVO', 'AUXI_ADMINISTRATIVO')
  AND p.name IN (
    'DASHBOARD_READ',
    'PROFILE_READ',
    'PROFILE_WRITE',
    'MESSAGES_READ',
    'MESSAGES_WRITE',
    'MESSAGES_CREATE',
    'FINANCIAL_READ',
    'FINANCIAL_WRITE',
    'FINANCIAL_CREATE',
    'EQUIPMENTS_READ',
    'EQUIPMENTS_WRITE',
    'EQUIPMENTS_CREATE',
    'FLEET_READ',
    'FLEET_WRITE',
    'FLEET_CREATE',
    'FLEET_WORK_ORDERS_READ',
    'FLEET_WORK_ORDERS_WRITE',
    'FLEET_WORK_ORDERS_CREATE',
    'STOCK_READ',
    'STOCK_WRITE',
    'CONTRACTS_READ',
    'REPORTS_READ'
  )
ON CONFLICT DO NOTHING;
