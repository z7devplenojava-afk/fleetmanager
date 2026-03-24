-- Migration: V239__remove_old_role_column.sql
-- Description: Remove the old role enum column from users table

-- Drop the old role enum column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- First, let's see what roles are available
-- Then update existing users to have role_id based on their current role enum
-- For now, we'll set all users without role_id to have the VIGILANTE role (equivalent to COLABORADOR)

-- Ensure role_id is NOT NULL for all existing users
UPDATE users SET role_id = (
    SELECT id FROM roles WHERE name = 'VIGILANTE' LIMIT 1
) WHERE role_id IS NULL;

-- If VIGILANTE role doesn't exist, try with the first available role
UPDATE users SET role_id = (
    SELECT id FROM roles LIMIT 1
) WHERE role_id IS NULL;

-- Now we can safely make role_id NOT NULL
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL; 