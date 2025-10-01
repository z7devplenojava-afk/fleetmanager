-- Garantir associação do usuário jose.ramos ao grupo GRUPO_SUPER_ADMIN (id = 1)
INSERT INTO user_group_membership (user_id, group_id, created_at)
SELECT u.id, 1, NOW()
FROM users u
WHERE u.username = 'jose.ramos'
ON CONFLICT (user_id, group_id) DO NOTHING; 