-- ===========================================================================
-- V4653: Sync payrolls table to match Payroll.java entity fields
-- Problema: V207 foi registrada no flyway_schema_history como success=true,
--           mas as colunas status, payment_date, notes, approved_at, closed_at
--           nao existem na tabela payrolls (tabela pode ter sido recriada depois).
-- Solucao: Adicionar as colunas faltantes com ADD COLUMN IF NOT EXISTS (idempotente)
-- ===========================================================================

ALTER TABLE payrolls
    ADD COLUMN IF NOT EXISTS status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS payment_date  DATE,
    ADD COLUMN IF NOT EXISTS notes         TEXT,
    ADD COLUMN IF NOT EXISTS approved_at   TIMESTAMP,
    ADD COLUMN IF NOT EXISTS closed_at     TIMESTAMP;

-- Garantir constraint de unicidade (idempotente)
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
