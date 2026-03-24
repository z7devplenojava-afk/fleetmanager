-- ================================================
-- Migration V99: Time Control Module - Database Foundation
-- ================================================
-- Cria tabelas para Controle de Ponto e Jornada
-- Integra com employees e companies existentes
-- ================================================

-- 1. Jornadas de Trabalho (Turnos)
CREATE TABLE work_shifts (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    entry_time TIME,
    exit_time TIME,
    break_start TIME,
    break_end TIME,
    flexible_minutes INT DEFAULT 10,
    is_night_shift BOOLEAN DEFAULT FALSE,
    night_shift_start TIME DEFAULT '22:00',
    night_shift_end TIME DEFAULT '05:00',
    company_id UUID NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_work_shifts_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_work_shifts_company ON work_shifts(company_id);
CREATE INDEX idx_work_shifts_active ON work_shifts(active);

-- 2. Escalas de Trabalho (Padrões de Repetição)
CREATE TABLE work_scales (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    work_days VARCHAR(7) DEFAULT '1111100',
    company_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_work_scales_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_work_scales_company ON work_scales(company_id);

-- 3. Registros de Ponto (Batidas)
DROP TABLE IF EXISTS time_records CASCADE;
CREATE TABLE time_records (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    type VARCHAR(20) NOT NULL,
    origin VARCHAR(20) NOT NULL,
    
    -- Auditoria e Segurança
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    device_info VARCHAR(255),
    is_manual BOOLEAN DEFAULT FALSE,
    original_record_id UUID,
    justification_id UUID,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_time_records_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_time_records_original FOREIGN KEY (original_record_id) REFERENCES time_records(id) ON DELETE SET NULL
);

-- Índices críticos para performance
CREATE INDEX idx_time_records_employee ON time_records(employee_id);
CREATE INDEX idx_time_records_employee_date ON time_records(employee_id, recorded_at);
CREATE INDEX idx_time_records_recorded_at ON time_records(recorded_at);
CREATE INDEX idx_time_records_type ON time_records(type);

-- 4. Resumo Diário (Espelho de Ponto)
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    reference_date DATE NOT NULL,
    
    -- Dados Calculados (em minutos)
    expected_hours INT,
    worked_hours INT,
    balance_hours INT,
    night_shift_minutes INT DEFAULT 0,
    extra_50_minutes INT DEFAULT 0,
    extra_100_minutes INT DEFAULT 0,
    
    -- Status
    status VARCHAR(20),
    is_holiday BOOLEAN DEFAULT FALSE,
    is_day_off BOOLEAN DEFAULT FALSE,
    closed BOOLEAN DEFAULT FALSE,
    
    calculated_at TIMESTAMP DEFAULT NOW(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_daily_summaries_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_daily_summaries_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Índice único: um resumo por funcionário por dia
CREATE UNIQUE INDEX idx_daily_summaries_unique ON daily_summaries(employee_id, reference_date);
CREATE INDEX idx_daily_summaries_date ON daily_summaries(reference_date);
CREATE INDEX idx_daily_summaries_status ON daily_summaries(status);
CREATE INDEX idx_daily_summaries_closed ON daily_summaries(closed);

-- 5. Banco de Horas
CREATE TABLE time_banks (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    previous_balance INT DEFAULT 0,
    period_balance INT DEFAULT 0,
    total_balance INT DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'OPEN',
    company_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_time_banks_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_time_banks_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_time_banks_employee ON time_banks(employee_id);
CREATE INDEX idx_time_banks_period ON time_banks(period_start, period_end);
CREATE INDEX idx_time_banks_status ON time_banks(status);

-- 6. Justificativas (Abonos)
CREATE TABLE justifications (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    attachment_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'PENDING',
    reference_date DATE,
    
    approved_by UUID,
    approved_at TIMESTAMP,
    
    company_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_justifications_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_justifications_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_justifications_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_justifications_employee ON justifications(employee_id);
CREATE INDEX idx_justifications_status ON justifications(status);
CREATE INDEX idx_justifications_date ON justifications(reference_date);

-- Adicionar FK em time_records que referencia justifications
ALTER TABLE time_records 
ADD CONSTRAINT fk_time_records_justification 
FOREIGN KEY (justification_id) REFERENCES justifications(id) ON DELETE SET NULL;

-- ================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================
COMMENT ON TABLE work_shifts IS 'Define horários padrão de trabalho (ex: 08-18, 12x36)';
COMMENT ON TABLE work_scales IS 'Define padrões de repetição/escala (5x2, 12x36)';
COMMENT ON TABLE time_records IS 'Registros brutos de ponto (imutáveis, auditáveis)';
COMMENT ON TABLE daily_summaries IS 'Cache consolidado do espelho de ponto diário';
COMMENT ON TABLE time_banks IS 'Saldo de banco de horas por período';
COMMENT ON TABLE justifications IS 'Abonos e justificativas de faltas/atrasos';

COMMENT ON COLUMN time_records.is_manual IS 'Se verdadeiro, registro foi inserido/ajustado manualmente pelo RH';
COMMENT ON COLUMN time_records.original_record_id IS 'Aponta para registro original se este for um ajuste';
COMMENT ON COLUMN daily_summaries.closed IS 'Se verdadeiro, período está fechado e não pode ser editado';
COMMENT ON COLUMN time_banks.status IS 'OPEN, CLOSED, PAID';
