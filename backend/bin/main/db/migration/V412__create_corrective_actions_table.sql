-- Tabela de Ações Corretivas
CREATE TABLE IF NOT EXISTS corrective_actions (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    origin VARCHAR(50) NOT NULL, -- INSPECAO, ACIDENTE, AUDITORIA, NAO_CONFORMIDADE, OUTROS
    priority VARCHAR(20) NOT NULL, -- BAIXA, MEDIA, ALTA, CRITICA
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA
    responsible_user_id UUID,
    responsible_name VARCHAR(255),
    due_date DATE NOT NULL,
    completion_date DATE,
    department VARCHAR(100),
    notes TEXT,
    related_inspection_id UUID,
    related_accident_id UUID,
    related_non_conformity_id UUID,
    created_by_user_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar foreign keys de forma segura (verificando se as tabelas existem e têm PRIMARY KEY)
DO $$
BEGIN
    -- Foreign key para users (responsible_user_id)
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'
    ) AND EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND contype = 'p'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_corrective_actions_responsible_user'
        ) THEN
            ALTER TABLE corrective_actions 
            ADD CONSTRAINT fk_corrective_actions_responsible_user 
            FOREIGN KEY (responsible_user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- Foreign key para users (created_by_user_id)
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'
    ) AND EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND contype = 'p'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_corrective_actions_created_by_user'
        ) THEN
            ALTER TABLE corrective_actions 
            ADD CONSTRAINT fk_corrective_actions_created_by_user 
            FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- Foreign key para safety_inspections
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'safety_inspections'
    ) AND EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'safety_inspections'::regclass 
        AND contype = 'p'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_corrective_actions_inspection'
        ) THEN
            ALTER TABLE corrective_actions 
            ADD CONSTRAINT fk_corrective_actions_inspection 
            FOREIGN KEY (related_inspection_id) REFERENCES safety_inspections(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- Foreign key para accident_records
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accident_records'
    ) AND EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'accident_records'::regclass 
        AND contype = 'p'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_corrective_actions_accident'
        ) THEN
            ALTER TABLE corrective_actions 
            ADD CONSTRAINT fk_corrective_actions_accident 
            FOREIGN KEY (related_accident_id) REFERENCES accident_records(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- Foreign key para non_conformities
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'non_conformities'
    ) AND EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'non_conformities'::regclass 
        AND contype = 'p'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_corrective_actions_non_conformity'
        ) THEN
            ALTER TABLE corrective_actions 
            ADD CONSTRAINT fk_corrective_actions_non_conformity 
            FOREIGN KEY (related_non_conformity_id) REFERENCES non_conformities(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_corrective_actions_status ON corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_priority ON corrective_actions(priority);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_origin ON corrective_actions(origin);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_due_date ON corrective_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_responsible_user_id ON corrective_actions(responsible_user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_corrective_actions_updated_at
    BEFORE UPDATE ON corrective_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();




