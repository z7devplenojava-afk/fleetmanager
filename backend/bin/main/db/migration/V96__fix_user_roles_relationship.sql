-- Migration: V240__fix_user_roles_relationship.sql
-- Description: Fix the relationship between users and roles by populating user_roles table

-- First, let's ensure all users have a role_id
UPDATE users SET role_id = (
    SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1
) WHERE role_id IS NULL;

-- Now populate the user_roles table based on existing role_id relationships
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, u.role_id
FROM users u
WHERE u.role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = u.role_id
  );

-- Verify the data
SELECT 
    u.username,
    u.email,
    r.name as role_name,
    CASE WHEN ur.user_id IS NOT NULL THEN 'OK' ELSE 'MISSING' END as user_roles_status
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND u.role_id = ur.role_id
ORDER BY u.username; 

ALTER TABLE fuel_records ADD COLUMN receipt_url VARCHAR(255); 