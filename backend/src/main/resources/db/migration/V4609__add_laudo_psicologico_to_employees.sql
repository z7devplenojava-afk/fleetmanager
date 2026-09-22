-- Migration: V4609__add_laudo_psicologico_to_employees.sql
-- Description: Adiciona campos de Laudo Psicológico e próximos vencimentos de exames no cadastro de funcionários

-- 1. Data do laudo psicológico (exame psicotécnico)
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS laudo_psicologico_data DATE;

-- 2. Próximo vencimento do laudo psicológico (data + 1 ano, calculado pelo backend)
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS next_laudo_psicologico DATE;

-- 3. Próximo vencimento do ASO (data do exame + 1 ano, calculado pelo backend)
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS next_exame_medico DATE;

-- 4. Popular registros existentes com base na data do exame atual
UPDATE employees
SET next_exame_medico = exame_medico_data + INTERVAL '1 year'
WHERE next_exame_medico IS NULL
  AND exame_medico_data IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employees_next_exame_medico ON employees(next_exame_medico);
CREATE INDEX IF NOT EXISTS idx_employees_next_laudo_psicologico ON employees(next_laudo_psicologico);
