-- Adicionar work_post_id à tabela employee_certifications para rastrear o posto de trabalho onde o treinamento foi realizado

-- Adicionar coluna work_post_id
ALTER TABLE employee_certifications 
ADD COLUMN IF NOT EXISTS work_post_id UUID;

-- Verificar se a tabela work_posts existe antes de adicionar a foreign key
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_employee_certifications_work_post'
    ) THEN
        -- Verificar se a tabela work_posts existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_posts') THEN
            -- Adicionar foreign key para work_posts
            ALTER TABLE employee_certifications 
            ADD CONSTRAINT fk_employee_certifications_work_post 
            FOREIGN KEY (work_post_id) 
            REFERENCES work_posts(id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Foreign key fk_employee_certifications_work_post criada com sucesso';
        ELSE
            RAISE NOTICE 'Tabela work_posts não existe. Foreign key não foi criada.';
        END IF;
    ELSE
        RAISE NOTICE 'Foreign key fk_employee_certifications_work_post já existe';
    END IF;
END $$;

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_employee_certifications_work_post 
ON employee_certifications(work_post_id);

