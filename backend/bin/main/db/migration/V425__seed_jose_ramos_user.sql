-- Migration V425: Seed jose.ramos user
-- Restore super admin access after database wipe

-- Insert user jose.ramos (without the dropped 'role' column)
INSERT INTO users (id, username, password, email, name, status, active, created_at, updated_at)
VALUES (
    '8b63e5ce-0a98-490d-b11f-82990b3dc5be', 
    'jose.ramos',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Password123!
    'jose.ramos@dominio.com',
    'José Mário Ramos',
    'ACTIVE',
    true,
    NOW(),
    NOW()
) ON CONFLICT (username) DO UPDATE SET
    active = true,
    updated_at = NOW();

-- Assign the SUPER_ADMIN role in user_roles join table
INSERT INTO user_roles (user_id, role_id)
SELECT '8b63e5ce-0a98-490d-b11f-82990b3dc5be', id
FROM roles 
WHERE name = 'SUPER_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Associate with GRUPO_SUPER_ADMIN in user_group_membership join table
INSERT INTO user_group_membership (user_id, group_id, created_at)
SELECT '8b63e5ce-0a98-490d-b11f-82990b3dc5be', id, NOW()
FROM user_groups 
WHERE group_name = 'GRUPO_SUPER_ADMIN'
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Fallback for systems that might still have role_id column in users table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id') THEN
        UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1)
        WHERE id = '8b63e5ce-0a98-490d-b11f-82990b3dc5be';
    END IF;
END $$;
