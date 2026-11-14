-- V4712: Adicionar colunas faltantes na tabela dependents para sincronizar com a entidade JPA Dependent
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dependents') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'address') THEN
            ALTER TABLE dependents ADD COLUMN address VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'city') THEN
            ALTER TABLE dependents ADD COLUMN city VARCHAR(100);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'state') THEN
            ALTER TABLE dependents ADD COLUMN state VARCHAR(2);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'zip_code') THEN
            ALTER TABLE dependents ADD COLUMN zip_code VARCHAR(10);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'gender') THEN
            ALTER TABLE dependents ADD COLUMN gender VARCHAR(10);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'phone') THEN
            ALTER TABLE dependents ADD COLUMN phone VARCHAR(20);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'email') THEN
            ALTER TABLE dependents ADD COLUMN email VARCHAR(100);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'is_student') THEN
            ALTER TABLE dependents ADD COLUMN is_student BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'school_name') THEN
            ALTER TABLE dependents ADD COLUMN school_name VARCHAR(100);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'is_beneficiary') THEN
            ALTER TABLE dependents ADD COLUMN is_beneficiary BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'notes') THEN
            ALTER TABLE dependents ADD COLUMN notes VARCHAR(500);
        END IF;
    END IF;
END $$;
