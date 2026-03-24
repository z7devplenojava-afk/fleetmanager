-- Adiciona colunas de status e pagamento à tabela payrolls e constraint de unicidade por funcionário+mês
ALTER TABLE payrolls
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS payment_date DATE,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- Evitar duplicidade de folha por funcionário e mês de referência
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'payrolls' AND constraint_name = 'uk_payroll_employee_month'
    ) THEN
        ALTER TABLE payrolls
            ADD CONSTRAINT uk_payroll_employee_month UNIQUE (employee_id, reference_month);
    END IF;
END $$;

