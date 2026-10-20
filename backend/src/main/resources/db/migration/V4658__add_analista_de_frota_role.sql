-- Migration V4658: Cadastrar role ANALISTA_DE_FROTA e ANALISTA_FROTA com permissões de Manutenção e Frota

INSERT INTO roles (id, name, description)
VALUES 
    (gen_random_uuid(), 'ANALISTA_DE_FROTA', 'Analista de Frota - Gestão e Operação de Manutenção e Frota'),
    (gen_random_uuid(), 'ANALISTA_FROTA', 'Analista de Frota - Gestão e Operação de Manutenção e Frota')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- Vincular todas as permissões de Manutenção e Frota às novas roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('ANALISTA_DE_FROTA', 'ANALISTA_FROTA')
  AND p.name IN (
    'DASHBOARD_READ',
    'PROFILE_READ',
    'PROFILE_WRITE',
    'MESSAGES_READ',
    'MESSAGES_WRITE',
    'MESSAGES_CREATE',
    'EQUIPMENTS_READ',
    'EQUIPMENTS_WRITE',
    'EQUIPMENTS_CREATE',
    'EQUIPMENTS_ASSIGN',
    'FLEET_READ',
    'FLEET_WRITE',
    'FLEET_CREATE',
    'FLEET_WORK_ORDERS_READ',
    'FLEET_WORK_ORDERS_WRITE',
    'FLEET_WORK_ORDERS_CREATE',
    'STOCK_READ',
    'STOCK_WRITE',
    'REPORTS_READ',
    'REPORTS_GENERATE'
  )
ON CONFLICT DO NOTHING;
