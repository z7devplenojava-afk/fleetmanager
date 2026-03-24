-- Script para inserir o usuário SUPER_ADMIN com acesso total ao sistema
-- Execute este script para garantir que o superadmin tenha todas as funcionalidades disponíveis

-- Inserir o usuário SUPER_ADMIN
INSERT INTO users (name, email, username, password, role, active, created_at, updated_at)
VALUES (
    'Super Administrador do Sistema',
    'superadmin@promover.com',
    'superadmin',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: Password123!
    'SUPER_ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    updated_at = NOW();

-- Associar o usuário ao grupo SUPER_ADMIN
INSERT INTO user_group_membership (user_id, group_id)
SELECT u.id, g.id
FROM users u, user_groups g
WHERE u.email = 'superadmin@promover.com' 
  AND g.group_name = 'GRUPO_SUPER_ADMIN'
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Verificar se o usuário foi criado corretamente
SELECT 
    u.id,
    u.name,
    u.email,
    u.username,
    u.role,
    u.active,
    u.created_at,
    g.group_name,
    g.display_name
FROM users u
LEFT JOIN user_group_membership ugm ON u.id = ugm.user_id
LEFT JOIN user_groups g ON ugm.group_id = g.id
WHERE u.email = 'superadmin@promover.com';

-- Verificar todas as permissões do grupo SUPER_ADMIN
SELECT 
    g.group_name,
    g.display_name,
    ugp.permission
FROM user_groups g
JOIN user_group_permissions ugp ON g.id = ugp.group_id
WHERE g.group_name = 'GRUPO_SUPER_ADMIN'
ORDER BY ugp.permission; 