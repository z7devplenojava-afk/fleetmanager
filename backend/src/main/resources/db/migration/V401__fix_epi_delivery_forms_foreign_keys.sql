-- Migração de reparo para V397: Corrigir foreign keys da tabela epi_delivery_forms
-- Esta migração garante que as foreign keys sejam adicionadas corretamente mesmo se V397 falhou parcialmente

-- Remover foreign keys existentes se houver (caso V397 tenha falhado parcialmente)
DO $$
BEGIN
    -- Remover constraint se existir
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'epi_delivery_forms' 
        AND constraint_name = 'fk_epi_delivery_forms_employee'
    ) THEN
        ALTER TABLE epi_delivery_forms DROP CONSTRAINT fk_epi_delivery_forms_employee;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'epi_delivery_forms' 
        AND constraint_name = 'fk_epi_delivery_forms_responsible_employee'
    ) THEN
        ALTER TABLE epi_delivery_forms DROP CONSTRAINT fk_epi_delivery_forms_responsible_employee;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'epi_delivery_forms' 
        AND constraint_name = 'fk_epi_delivery_forms_company'
    ) THEN
        ALTER TABLE epi_delivery_forms DROP CONSTRAINT fk_epi_delivery_forms_company;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'epi_delivery_forms' 
        AND constraint_name = 'fk_epi_delivery_forms_created_by'
    ) THEN
        ALTER TABLE epi_delivery_forms DROP CONSTRAINT fk_epi_delivery_forms_created_by;
    END IF;
END $$;

-- Garantir que a tabela existe (criar se não existir)
CREATE TABLE IF NOT EXISTS epi_delivery_forms (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    company_id UUID NOT NULL,
    delivery_date DATE NOT NULL,
    responsible_employee_id UUID,
    observations TEXT,
    pdf_url VARCHAR(500),
    created_by_user_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar foreign keys apenas se as tabelas referenciadas existirem e tiverem PRIMARY KEY
DO $$
BEGIN
    -- Adicionar foreign key para employees (employee_id) se existir e tiver PRIMARY KEY
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'employees' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'epi_delivery_forms' 
            AND constraint_name = 'fk_epi_delivery_forms_employee'
        ) THEN
            ALTER TABLE epi_delivery_forms
            ADD CONSTRAINT fk_epi_delivery_forms_employee
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Adicionar foreign key para employees (responsible_employee_id) se existir e tiver PRIMARY KEY
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'employees' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'epi_delivery_forms' 
            AND constraint_name = 'fk_epi_delivery_forms_responsible_employee'
        ) THEN
            ALTER TABLE epi_delivery_forms
            ADD CONSTRAINT fk_epi_delivery_forms_responsible_employee
            FOREIGN KEY (responsible_employee_id) REFERENCES employees(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Adicionar foreign key para companies se existir e tiver PRIMARY KEY
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'companies' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'epi_delivery_forms' 
            AND constraint_name = 'fk_epi_delivery_forms_company'
        ) THEN
            ALTER TABLE epi_delivery_forms
            ADD CONSTRAINT fk_epi_delivery_forms_company
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Adicionar foreign key para users se existir e tiver PRIMARY KEY
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'epi_delivery_forms' 
            AND constraint_name = 'fk_epi_delivery_forms_created_by'
        ) THEN
            ALTER TABLE epi_delivery_forms
            ADD CONSTRAINT fk_epi_delivery_forms_created_by
            FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Garantir que a tabela de itens existe
CREATE TABLE IF NOT EXISTS epi_delivery_form_items (
    id UUID PRIMARY KEY,
    delivery_form_id UUID NOT NULL,
    epi_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    ca VARCHAR(100),
    validity_date DATE,
    uniform_type VARCHAR(50),
    uniform_piece VARCHAR(50),
    observations TEXT
);

-- Adicionar foreign key para epi_delivery_forms se existir e tiver PRIMARY KEY
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'epi_delivery_forms' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'epi_delivery_form_items' 
            AND constraint_name = 'fk_epi_delivery_form_items_delivery_form'
        ) THEN
            ALTER TABLE epi_delivery_form_items
            ADD CONSTRAINT fk_epi_delivery_form_items_delivery_form
            FOREIGN KEY (delivery_form_id) REFERENCES epi_delivery_forms(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_epi_delivery_forms_employee_id ON epi_delivery_forms(employee_id);
CREATE INDEX IF NOT EXISTS idx_epi_delivery_forms_company_id ON epi_delivery_forms(company_id);
CREATE INDEX IF NOT EXISTS idx_epi_delivery_forms_delivery_date ON epi_delivery_forms(delivery_date);
CREATE INDEX IF NOT EXISTS idx_epi_delivery_form_items_delivery_form_id ON epi_delivery_form_items(delivery_form_id);

-- Comentários nas tabelas
COMMENT ON TABLE epi_delivery_forms IS 'Fichas completas de entrega de EPI para funcionários';
COMMENT ON TABLE epi_delivery_form_items IS 'Itens de EPI dentro de cada ficha de entrega';

