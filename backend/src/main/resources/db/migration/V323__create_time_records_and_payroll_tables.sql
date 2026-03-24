-- ====================================
-- SISTEMA DE PONTO ELETRÔNICO E FOLHA
-- ====================================

-- Tabela de QR Codes para Postos de Trabalho
CREATE TABLE IF NOT EXISTS qrcode_work_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_post_id UUID NOT NULL REFERENCES work_posts(id) ON DELETE CASCADE,
    qr_code VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id UUID
);

CREATE INDEX idx_qrcode_work_posts_work_post_id ON qrcode_work_posts(work_post_id);
CREATE INDEX idx_qrcode_work_posts_qr_code ON qrcode_work_posts(qr_code);
CREATE INDEX idx_qrcode_work_posts_is_active ON qrcode_work_posts(is_active);

-- Tabela de Registros de Ponto (Nova versão com QR Code)
DROP TABLE IF EXISTS time_records CASCADE;

CREATE TABLE time_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    work_post_id UUID REFERENCES work_posts(id) ON DELETE SET NULL,
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA')),
    recorded_at TIMESTAMP NOT NULL,
    location VARCHAR(500),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    qr_code_used VARCHAR(255),
    device_info VARCHAR(500),
    photo_url VARCHAR(500),
    is_manual BOOLEAN DEFAULT false,
    justification TEXT,
    approved_by_id UUID,
    approved_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_records_employee_id ON time_records(employee_id);
CREATE INDEX idx_time_records_work_post_id ON time_records(work_post_id);
CREATE INDEX idx_time_records_recorded_at ON time_records(recorded_at);
CREATE INDEX idx_time_records_status ON time_records(status);
CREATE INDEX idx_time_records_employee_date ON time_records(employee_id, recorded_at);

-- Tabela de Fechamentos de Folha
CREATE TABLE IF NOT EXISTS payroll_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reference_month INTEGER NOT NULL CHECK (reference_month >= 1 AND reference_month <= 12),
    reference_year INTEGER NOT NULL CHECK (reference_year >= 2000),
    total_hours_worked NUMERIC(10, 2) DEFAULT 0,
    regular_hours NUMERIC(10, 2) DEFAULT 0,
    overtime_50 NUMERIC(10, 2) DEFAULT 0,
    overtime_100 NUMERIC(10, 2) DEFAULT 0,
    night_shift_hours NUMERIC(10, 2) DEFAULT 0,
    total_delays_minutes INTEGER DEFAULT 0,
    total_absences_days INTEGER DEFAULT 0,
    worked_days INTEGER DEFAULT 0,
    expected_days INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CLOSED', 'APPROVED', 'PROCESSED')),
    closed_at TIMESTAMP,
    closed_by_id UUID,
    observations TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, reference_month, reference_year)
);

CREATE INDEX idx_payroll_closures_employee_id ON payroll_closures(employee_id);
CREATE INDEX idx_payroll_closures_reference ON payroll_closures(reference_year, reference_month);
CREATE INDEX idx_payroll_closures_status ON payroll_closures(status);

-- Adicionar permissões
INSERT INTO permissions (id, name, description) VALUES
(gen_random_uuid(), 'TIME_RECORD_READ', 'Visualizar registros de ponto'),
(gen_random_uuid(), 'TIME_RECORD_CREATE', 'Criar registros de ponto'),
(gen_random_uuid(), 'TIME_RECORD_UPDATE', 'Editar registros de ponto'),
(gen_random_uuid(), 'TIME_RECORD_DELETE', 'Excluir registros de ponto'),
(gen_random_uuid(), 'TIME_RECORD_MANAGE', 'Gerenciar registros de ponto (aprovar/rejeitar)'),
(gen_random_uuid(), 'PAYROLL_READ', 'Visualizar fechamentos de folha'),
(gen_random_uuid(), 'PAYROLL_CREATE', 'Criar fechamentos de folha'),
(gen_random_uuid(), 'PAYROLL_MANAGE', 'Gerenciar fechamentos de folha')
ON CONFLICT (name) DO NOTHING;

-- Comentários
COMMENT ON TABLE qrcode_work_posts IS 'Tabela de QR Codes vinculados aos postos de trabalho para registro de ponto';
COMMENT ON TABLE time_records IS 'Tabela de registros de ponto eletrônico dos funcionários';
COMMENT ON TABLE payroll_closures IS 'Tabela de fechamentos de folha de pagamento por período';

COMMENT ON COLUMN time_records.record_type IS 'Tipo de registro: ENTRADA, SAIDA_ALMOCO, RETORNO_ALMOCO, SAIDA';
COMMENT ON COLUMN time_records.is_manual IS 'Indica se o registro foi feito manualmente ou via app';
COMMENT ON COLUMN time_records.status IS 'Status do registro: PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN payroll_closures.overtime_50 IS 'Horas extras com adicional de 50%';
COMMENT ON COLUMN payroll_closures.overtime_100 IS 'Horas extras com adicional de 100% (feriados/domingos)';

