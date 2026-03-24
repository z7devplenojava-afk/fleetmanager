-- ====================================
-- PRD: FECHAMENTO MENSAL DE HORAS
-- Fase 3: Períodos de Fechamento Customizados
-- ====================================

-- Tabela: pay_periods (períodos de fechamento de folha)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pay_periods') THEN
        CREATE TABLE pay_periods (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL, -- "Janeiro 2025", "15/01 a 14/02", "1ª Quinzena - Janeiro"
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('MONTHLY', 'CUSTOM', 'BIWEEKLY', 'WEEKLY')),
            reference_month INTEGER, -- Mês de referência (1-12)
            reference_year INTEGER, -- Ano de referência
            is_closed BOOLEAN DEFAULT false, -- Período fechado para novos fechamentos
            closed_at TIMESTAMP,
            closed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Garantir que não haja períodos sobrepostos (opcional, pode ser relaxado se necessário)
            CONSTRAINT valid_date_range CHECK (end_date >= start_date)
        );
        
        CREATE INDEX idx_pay_periods_type ON pay_periods(type);
        CREATE INDEX idx_pay_periods_reference ON pay_periods(reference_year, reference_month);
        CREATE INDEX idx_pay_periods_start_date ON pay_periods(start_date);
        CREATE INDEX idx_pay_periods_end_date ON pay_periods(end_date);
        CREATE INDEX idx_pay_periods_is_closed ON pay_periods(is_closed);
        
        COMMENT ON TABLE pay_periods IS 'Períodos de fechamento de folha (mensais, quinzenais, customizados)';
        COMMENT ON COLUMN pay_periods.type IS 'Tipo de período: MONTHLY (mês civil), CUSTOM (período customizado), BIWEEKLY (quinzenal), WEEKLY (semanal)';
        COMMENT ON COLUMN pay_periods.reference_month IS 'Mês de referência (1-12) para períodos mensais';
        COMMENT ON COLUMN pay_periods.reference_year IS 'Ano de referência';
    END IF;
END $$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_pay_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'pay_periods_updated_at_trigger'
    ) THEN
        CREATE TRIGGER pay_periods_updated_at_trigger
        BEFORE UPDATE ON pay_periods
        FOR EACH ROW
        EXECUTE FUNCTION update_pay_periods_updated_at();
    END IF;
END $$;

-- Estender payroll_closures para referenciar pay_period (opcional)
DO $$
BEGIN
    -- Adicionar campo pay_period_id (opcional, pode ser NULL para manter compatibilidade)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_closures' AND column_name = 'pay_period_id'
    ) THEN
        ALTER TABLE payroll_closures ADD COLUMN pay_period_id UUID;
    END IF;
    
    -- Adicionar índice
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payroll_closures_pay_period_id'
    ) THEN
        CREATE INDEX idx_payroll_closures_pay_period_id ON payroll_closures(pay_period_id);
    END IF;
    
    -- Adicionar foreign key opcional
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payroll_closures_pay_period'
    ) THEN
        ALTER TABLE payroll_closures 
        ADD CONSTRAINT fk_payroll_closures_pay_period 
        FOREIGN KEY (pay_period_id) REFERENCES pay_periods(id) ON DELETE SET NULL;
    END IF;
END $$;





