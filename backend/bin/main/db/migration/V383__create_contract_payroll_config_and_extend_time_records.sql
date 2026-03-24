-- ====================================
-- PRD: FECHAMENTO MENSAL DE HORAS
-- Fase 2: Configurações por Contrato e Extensões
-- ====================================

-- Tabela: contract_payroll_config (configurações de folha por contrato)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract_payroll_config') THEN
        CREATE TABLE contract_payroll_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
            hour_divisor NUMERIC(5,2) DEFAULT 220.0, -- Horas/mês esperadas (ex: 220h para 44h/sem)
            daily_hours NUMERIC(4,2) DEFAULT 8.0, -- Horas/dia padrão
            night_shift_start TIME DEFAULT '22:00:00',
            night_shift_end TIME DEFAULT '05:00:00',
            night_shift_percentage NUMERIC(5,2) DEFAULT 20.0, -- % adicional noturno
            overtime_50_percentage NUMERIC(5,2) DEFAULT 50.0, -- % adicional para primeiras 2h extras
            overtime_100_percentage NUMERIC(5,2) DEFAULT 100.0, -- % adicional para horas extras acima de 2h
            sunday_overtime_percentage NUMERIC(5,2) DEFAULT 100.0, -- % adicional para domingos
            holiday_overtime_percentage NUMERIC(5,2) DEFAULT 100.0, -- % adicional para feriados
            delay_tolerance_minutes INTEGER DEFAULT 10, -- Tolerância para atrasos
            bank_hours_enabled BOOLEAN DEFAULT false, -- Banco de horas habilitado
            default_entry_time TIME DEFAULT '08:00:00', -- Horário padrão de entrada
            default_exit_time TIME DEFAULT '17:00:00', -- Horário padrão de saída
            lunch_duration_minutes INTEGER DEFAULT 60, -- Duração do intervalo de almoço
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Um contrato pode ter apenas uma configuração de folha
            UNIQUE(contract_id)
        );
        
        CREATE INDEX idx_contract_payroll_config_contract_id ON contract_payroll_config(contract_id);
        
        COMMENT ON TABLE contract_payroll_config IS 'Configurações de cálculo de folha por contrato';
        COMMENT ON COLUMN contract_payroll_config.hour_divisor IS 'Divisor de horas (ex: 220h para jornada de 44h/semana)';
        COMMENT ON COLUMN contract_payroll_config.daily_hours IS 'Horas trabalhadas padrão por dia';
        COMMENT ON COLUMN contract_payroll_config.night_shift_percentage IS 'Percentual de adicional noturno (ex: 20% = 0.20)';
    END IF;
END $$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_contract_payroll_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'contract_payroll_config_updated_at_trigger'
    ) THEN
        CREATE TRIGGER contract_payroll_config_updated_at_trigger
        BEFORE UPDATE ON contract_payroll_config
        FOR EACH ROW
        EXECUTE FUNCTION update_contract_payroll_config_updated_at();
    END IF;
END $$;

-- Extender time_records com campos para rastrear origem da importação
DO $$
BEGIN
    -- Adicionar campo para rastrear se foi processado de ponto_raw
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_records' AND column_name = 'processed_from_raw_id'
    ) THEN
        ALTER TABLE time_records ADD COLUMN processed_from_raw_id UUID;
    END IF;
    
    -- Adicionar campo para notas de processamento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_records' AND column_name = 'processing_notes'
    ) THEN
        ALTER TABLE time_records ADD COLUMN processing_notes TEXT;
    END IF;
    
    -- Adicionar índice
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_time_records_processed_from_raw_id'
    ) THEN
        CREATE INDEX idx_time_records_processed_from_raw_id ON time_records(processed_from_raw_id);
    END IF;
END $$;

-- Adicionar foreign key opcional para processed_from_raw_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_time_records_ponto_raw'
    ) THEN
        ALTER TABLE time_records 
        ADD CONSTRAINT fk_time_records_ponto_raw 
        FOREIGN KEY (processed_from_raw_id) REFERENCES ponto_raw(id) ON DELETE SET NULL;
    END IF;
END $$;





