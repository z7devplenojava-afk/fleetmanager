-- Migration V4663: Cadastrar role ENCARREGADO_DE_TRANSPORTES (e aliases) com as mesmas funções de Gestor/Encarregado de Tráfego

INSERT INTO roles (id, name, description)
VALUES 
    (gen_random_uuid(), 'ENCARREGADO_DE_TRANSPORTES', 'Encarregado de Transportes - Gestão Operacional de Tráfego, Escalas, Linhas e Frotas'),
    (gen_random_uuid(), 'ENCARREGADO_TRANSPORTES', 'Encarregado de Transportes - Gestão Operacional de Tráfego, Escalas, Linhas e Frotas'),
    (gen_random_uuid(), 'ENCARREGADO_DE_TRAFEGO', 'Encarregado de Tráfego - Gestão Operacional de Tráfego, Escalas e Linhas'),
    (gen_random_uuid(), 'ENCARREGADO_TRAFEGO', 'Encarregado de Tráfego - Gestão Operacional de Tráfego, Escalas e Linhas')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- Garantir que as roles de tráfego e transportes tenham todas as permissões operacionais necessárias
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN (
    'ENCARREGADO_DE_TRANSPORTES',
    'ENCARREGADO_TRANSPORTES',
    'ENCARREGADO_DE_TRAFEGO',
    'ENCARREGADO_TRAFEGO',
    'GESTOR_TRAFEGO',
    'GESTOR_DE_TRAFEGO'
)
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
    'EMPLOYEES_READ',
    'CONTRACTS_READ',
    'TRAFFIC_MANAGEMENT_READ',
    'TRAFFIC_MANAGEMENT_WRITE',
    'TRAFFIC_MANAGEMENT_CREATE',
    'TRAFFIC_MANAGEMENT_DELETE',
    'TRIPS_READ',
    'TRIPS_WRITE',
    'TRIPS_EXECUTE',
    'BOARDING_READ',
    'BOARDING_EXECUTE',
    'ROUTES_READ',
    'ROUTES_WRITE',
    'ROUTES_CREATE',
    'ROUTES_DELETE',
    'FLEET_READ',
    'FLEET_WRITE',
    'REPORTS_READ',
    'REPORTS_GENERATE'
  )
ON CONFLICT DO NOTHING;
