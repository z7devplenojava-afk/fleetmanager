-- Adicionar campos de exame médico ao Employee
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS exame_medico_data DATE,
ADD COLUMN IF NOT EXISTS exame_medico_tipo VARCHAR(50),
ADD COLUMN IF NOT EXISTS exame_medico_doctor_id UUID,
ADD COLUMN IF NOT EXISTS exame_medico_horario VARCHAR(100),
ADD COLUMN IF NOT EXISTS exame_medico_intervalos_refeicao BOOLEAN,
ADD COLUMN IF NOT EXISTS exame_medico_observacoes TEXT,
ADD COLUMN IF NOT EXISTS exame_medico_primeiro_emprego BOOLEAN,
ADD COLUMN IF NOT EXISTS exame_medico_contribuicao_sindical_paga BOOLEAN;

-- Adicionar foreign key para doctor (opcional, pode ser null)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_employees_exame_medico_doctor'
    ) THEN
        ALTER TABLE employees
        ADD CONSTRAINT fk_employees_exame_medico_doctor
        FOREIGN KEY (exame_medico_doctor_id) 
        REFERENCES doctors(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Índice para busca
CREATE INDEX IF NOT EXISTS idx_employees_exame_medico_data ON employees(exame_medico_data);
CREATE INDEX IF NOT EXISTS idx_employees_exame_medico_tipo ON employees(exame_medico_tipo);



