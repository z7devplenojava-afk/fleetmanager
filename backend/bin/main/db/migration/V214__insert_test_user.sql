-- Inserção de usuário de teste para desenvolvimento
-- Senha: Password123! (hash BCrypt)
INSERT INTO users (id, username, password, email, name, status, active)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    'testuser',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'test@example.com',
    'Usuário Teste',
    'ACTIVE',
    true
) ON CONFLICT (username) DO NOTHING;

-- Associar testuser ao grupo ADMIN (apenas se o usuário foi inserido)
INSERT INTO user_group_membership (user_id, group_id)
SELECT '00000000-0000-0000-0000-000000000010', id 
FROM user_groups 
WHERE group_name = 'GRUPO_ADMIN'
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Usuário RH
INSERT INTO users (id, username, password, email, name, status, active)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    'rhuser',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'rh@example.com',
    'Usuário RH',
    'ACTIVE',
    true
) ON CONFLICT (username) DO NOTHING;

-- Associar rhuser ao grupo RH (apenas se o usuário foi inserido)
INSERT INTO user_group_membership (user_id, group_id)
SELECT '00000000-0000-0000-0000-000000000011', id 
FROM user_groups 
WHERE group_name = 'GRUPO_RH'
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Usuário Colaborador
INSERT INTO users (id, username, password, email, name, status, active)
VALUES (
    '00000000-0000-0000-0000-000000000012',
    'colaborador',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'colaborador@example.com',
    'Colaborador Teste',
    'ACTIVE',
    true
) ON CONFLICT (username) DO NOTHING;

-- Associar colaborador ao grupo VIGILANTES (apenas se o usuário foi inserido)
INSERT INTO user_group_membership (user_id, group_id)
SELECT '00000000-0000-0000-0000-000000000012', id 
FROM user_groups 
WHERE group_name = 'GRUPO_VIGILANTES'
ON CONFLICT (user_id, group_id) DO NOTHING; 