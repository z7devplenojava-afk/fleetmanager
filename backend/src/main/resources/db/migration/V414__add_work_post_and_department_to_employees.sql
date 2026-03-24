-- Adicionar colunas work_post_id e department_id à tabela employees
-- Migration: V414__add_work_post_and_department_to_employees.sql

-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
    -- Adicionar work_post_id se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'work_post_id'
    ) THEN
        ALTER TABLE employees 
        ADD COLUMN work_post_id UUID;
        
        -- Adicionar foreign key para work_posts se a tabela existir e tiver PRIMARY KEY
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_posts') THEN
            IF EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conrelid = 'work_posts'::regclass 
                AND contype = 'p'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_employees_work_post'
                ) THEN
                    ALTER TABLE employees
                    ADD CONSTRAINT fk_employees_work_post
                    FOREIGN KEY (work_post_id) 
                    REFERENCES work_posts(id) 
                    ON DELETE SET NULL;
                END IF;
                
                CREATE INDEX IF NOT EXISTS idx_employees_work_post_id ON employees(work_post_id);
            END IF;
        END IF;
        
        RAISE NOTICE 'Coluna work_post_id adicionada à tabela employees';
    ELSE
        RAISE NOTICE 'Coluna work_post_id já existe na tabela employees';
    END IF;
    
    -- Adicionar department_id se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'department_id'
    ) THEN
        ALTER TABLE employees 
        ADD COLUMN department_id UUID;
        
        -- Adicionar foreign key para departments se a tabela existir e tiver PRIMARY KEY
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
            IF EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conrelid = 'departments'::regclass 
                AND contype = 'p'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_employees_department'
                ) THEN
                    ALTER TABLE employees
                    ADD CONSTRAINT fk_employees_department
                    FOREIGN KEY (department_id) 
                    REFERENCES departments(id) 
                    ON DELETE SET NULL;
                END IF;
                
                CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
            END IF;
        END IF;
        
        RAISE NOTICE 'Coluna department_id adicionada à tabela employees';
    ELSE
        RAISE NOTICE 'Coluna department_id já existe na tabela employees';
    END IF;
END $$;
