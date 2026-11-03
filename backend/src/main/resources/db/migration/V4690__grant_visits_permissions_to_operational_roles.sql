-- ============================================================================
-- Visitas (Gestão de Visitas do Supervisor)
-- ============================================================================
-- As permissoes VISITS_* existiam na tabela `permissions` desde a V90, mas
-- nunca foram associadas a nenhuma role. Com isso, as telas de Visitas
-- embutidas no modulo Operacional respondiam 403 para os perfis operacionais,
-- mesmo o mapa de permissoes do frontend (src/utils/permissions.ts) prevendo
-- VISITS_READ/WRITE/CREATE para OPERACIONAL/PORTARIA e VISITS_READ para
-- VIGILANTE.
--
-- Esta migration alinha o backend ao contrato do frontend. As permissoes
-- VISITS_UPDATE/VISITS_MANAGE nao existem na tabela `permissions`, por isso
-- nao sao concedidas aqui.

INSERT INTO permissions (id, name, description)
VALUES
    (gen_random_uuid(), 'VISITS_READ',   'Visualizar Visits'),
    (gen_random_uuid(), 'VISITS_WRITE',  'Editar Visits'),
    (gen_random_uuid(), 'VISITS_CREATE', 'Criar Visits'),
    (gen_random_uuid(), 'VISITS_DELETE', 'Excluir Visits')
ON CONFLICT (name) DO NOTHING;

-- OPERACIONAL: leitura, edicao e criacao de visitas
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'OPERACIONAL'
  AND p.name IN ('VISITS_READ', 'VISITS_WRITE', 'VISITS_CREATE')
ON CONFLICT DO NOTHING;

-- PORTARIA: leitura, edicao e criacao de visitas
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'PORTARIA'
  AND p.name IN ('VISITS_READ', 'VISITS_WRITE', 'VISITS_CREATE')
ON CONFLICT DO NOTHING;

-- VIGILANTE: apenas leitura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'VIGILANTE'
  AND p.name = 'VISITS_READ'
ON CONFLICT DO NOTHING;
