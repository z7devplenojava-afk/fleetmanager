-- Migration V153: Add employee status enum
-- This migration adds an enum for employee status to better track employee states

-- Create employee status enum
CREATE TYPE employee_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ON_VACATION',
    'ON_LEAVE',
    'TERMINATED',
    'PENDING'
);

-- Add status column to employees table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'status'
    ) THEN
        ALTER TABLE employees ADD COLUMN status employee_status DEFAULT 'ACTIVE';
    END IF;
END $$;

-- Update existing employees to have ACTIVE status
UPDATE employees SET status = 'ACTIVE' WHERE status IS NULL;

-- Make status column NOT NULL after setting default values
ALTER TABLE employees ALTER COLUMN status SET NOT NULL; 