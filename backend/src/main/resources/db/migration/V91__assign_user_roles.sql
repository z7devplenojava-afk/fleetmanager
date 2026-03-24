-- Migration: V235__assign_user_roles.sql
-- Description: Assign roles to existing users

-- Assign SUPER_ADMIN role to jose.ramos
INSERT INTO user_roles (user_id, role_id)
SELECT 
    (SELECT id FROM users WHERE username = 'jose.ramos'),
    (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
WHERE EXISTS (SELECT 1 FROM users WHERE username = 'jose.ramos')
  AND EXISTS (SELECT 1 FROM roles WHERE name = 'SUPER_ADMIN'); 