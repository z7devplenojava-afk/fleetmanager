-- Adicionar campos para armazenar funcionário identificado no local da visita
-- Quando o QR Code não funciona, pode-se informar CPF ou matrícula

ALTER TABLE visit_controls
ADD COLUMN IF NOT EXISTS employee_id UUID,
ADD COLUMN IF NOT EXISTS employee_cpf VARCHAR(20),
ADD COLUMN IF NOT EXISTS employee_registration_number VARCHAR(50);

-- Adicionar foreign key para employee apenas se a tabela employees existir e tiver PRIMARY KEY
DO $$
BEGIN
    -- Verificar se a tabela employees existe e tem PRIMARY KEY
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'employees' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        -- Adicionar foreign key para employees
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'visit_controls' 
            AND constraint_name = 'fk_visit_control_employee'
        ) THEN
            ALTER TABLE visit_controls
            ADD CONSTRAINT fk_visit_control_employee
            FOREIGN KEY (employee_id) REFERENCES employees(id);
        END IF;
    END IF;
END $$;

-- Adicionar índices para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_visit_controls_employee_id ON visit_controls(employee_id);
CREATE INDEX IF NOT EXISTS idx_visit_controls_employee_cpf ON visit_controls(employee_cpf);
CREATE INDEX IF NOT EXISTS idx_visit_controls_employee_registration ON visit_controls(employee_registration_number);



