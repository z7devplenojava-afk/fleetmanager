-- V4668: Adicionar colunas source e company_id na tabela driver_work_hours
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MANUAL';
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_driver_work_hours_company ON driver_work_hours(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_driver_work_hours_emp_date ON driver_work_hours(employee_id, reference_date);
