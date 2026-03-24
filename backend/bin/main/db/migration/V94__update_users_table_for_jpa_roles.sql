-- Migration: V238__update_users_table_for_jpa_roles.sql
-- Description: Update users table to use JPA roles instead of enum

-- Add role_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID;

-- Create foreign key constraint (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_role_id' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_role_id 
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Update existing users to have role_id based on their current role enum
-- This will be done in the application layer during startup

-- Make role_id NOT NULL after data migration
-- ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- Drop the old role enum column (will be done after confirming data migration)
-- ALTER TABLE users DROP COLUMN IF EXISTS role; 