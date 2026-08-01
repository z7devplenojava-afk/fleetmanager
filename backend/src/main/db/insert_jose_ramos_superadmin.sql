-- Script para criar o usuário SUPER_ADMIN jose.ramos
-- Senha: 123456

INSERT INTO users (name, email, username, password, role, active, status, created_at, updated_at)
VALUES (
    'José Mário Ramos',
    'jose.ramos@fluxbus.com.br',
    'jose.ramos',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: 123456
    'SUPER_ADMIN',
    true,
    'ACTIVE',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name     = EXCLUDED.name,
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    role     = EXCLUDED.role,
    active   = EXCLUDED.active,
    status   = EXCLUDED.status,
    updated_at = NOW();

-- Associar ao grupo SUPER_ADMIN
INSERT INTO user_group_membership (user_id, group_id)
SELECT u.id, g.id
FROM users u, user_groups g
WHERE u.username = 'jose.ramos'
  AND g.group_name = 'GRUPO_SUPER_ADMIN'
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Confirmar criação
SELECT id, name, email, username, role, active, status FROM users WHERE username = 'jose.ramos';
