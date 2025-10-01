-- Migration V154: Add employee contract fields
-- This migration adds contract-related fields to the employees table

-- Add contract start date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'contract_start_date'
    ) THEN
        ALTER TABLE employees ADD COLUMN contract_start_date DATE;
    END IF;
END $$;

-- Add contract end date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'contract_end_date'
    ) THEN
        ALTER TABLE employees ADD COLUMN contract_end_date DATE;
    END IF;
END $$;

-- Add contract type enum
CREATE TYPE contract_type AS ENUM (
    'CLT',
    'PJ',
    'TEMPORARY',
    'INTERNSHIP',
    'TRAINEE'
);

-- Add contract type column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'contract_type'
    ) THEN
        ALTER TABLE employees ADD COLUMN contract_type contract_type DEFAULT 'CLT';
    END IF;
END $$;

-- Add probation period end date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'probation_end_date'
    ) THEN
        ALTER TABLE employees ADD COLUMN probation_end_date DATE;
    END IF;
END $$;

-- Add notice period days
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'notice_period_days'
    ) THEN
        ALTER TABLE employees ADD COLUMN notice_period_days INTEGER DEFAULT 30;
    END IF;
END $$;

-- Add contract renewal date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'contract_renewal_date'
    ) THEN
        ALTER TABLE employees ADD COLUMN contract_renewal_date DATE;
    END IF;
END $$; 