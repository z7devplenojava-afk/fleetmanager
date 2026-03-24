-- Garantir associação do usuário jose.ramos ao grupo GRUPO_SUPER_ADMIN
INSERT INTO user_group_membership (user_id, group_id, created_at)
SELECT u.id, g.id, NOW()
FROM users u, user_groups g
WHERE u.username = 'jose.ramos' 
  AND g.group_name = 'GRUPO_SUPER_ADMIN'
ON CONFLICT (user_id, group_id) DO NOTHING; 