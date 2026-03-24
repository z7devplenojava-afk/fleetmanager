-- Migration para criar tabela de serviços
-- V318__create_services_table.sql

-- Tabela de serviços
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(100),
    code VARCHAR(50) UNIQUE,
    unit_price DECIMAL(10,2),
    unit VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_billable BOOLEAN DEFAULT true,
    requires_equipment BOOLEAN DEFAULT false,
    requires_certification BOOLEAN DEFAULT false,
    estimated_duration_hours INTEGER,
    min_employees_required INTEGER DEFAULT 1,
    max_employees_allowed INTEGER,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Índices para melhor performance
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_services_code ON services(code);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_is_billable ON services(is_billable);
CREATE INDEX idx_services_requires_equipment ON services(requires_equipment);
CREATE INDEX idx_services_requires_certification ON services(requires_certification);
CREATE INDEX idx_services_created_at ON services(created_at);

-- Comentários na tabela
COMMENT ON TABLE services IS 'Tabela para armazenar serviços oferecidos pela empresa';
COMMENT ON COLUMN services.name IS 'Nome do serviço';
COMMENT ON COLUMN services.description IS 'Descrição detalhada do serviço';
COMMENT ON COLUMN services.category IS 'Categoria do serviço';
COMMENT ON COLUMN services.code IS 'Código único do serviço';
COMMENT ON COLUMN services.unit_price IS 'Preço unitário do serviço';
COMMENT ON COLUMN services.unit IS 'Unidade de medida (hora, dia, mês, etc.)';
COMMENT ON COLUMN services.status IS 'Status do serviço (ACTIVE, INACTIVE, SUSPENDED, DISCONTINUED)';
COMMENT ON COLUMN services.is_billable IS 'Se o serviço pode ser faturado';
COMMENT ON COLUMN services.requires_equipment IS 'Se o serviço requer equipamento específico';
COMMENT ON COLUMN services.requires_certification IS 'Se o serviço requer certificação';
COMMENT ON COLUMN services.estimated_duration_hours IS 'Duração estimada em horas';
COMMENT ON COLUMN services.min_employees_required IS 'Número mínimo de funcionários necessários';
COMMENT ON COLUMN services.max_employees_allowed IS 'Número máximo de funcionários permitidos';

-- Inserir dados de exemplo
INSERT INTO services (id, name, description, category, code, unit_price, unit, status, is_billable, requires_equipment, requires_certification, estimated_duration_hours, min_employees_required, max_employees_allowed, notes) VALUES
(gen_random_uuid(), 'Vigilância 24h', 'Serviço de vigilância 24 horas por dia', 'Vigilância', 'VIG-24H', 150.00, 'hora', 'ACTIVE', true, true, true, 24, 2, 4, 'Serviço de vigilância contínua'),
(gen_random_uuid(), 'Vigilância Diurna', 'Serviço de vigilância durante o dia', 'Vigilância', 'VIG-DIA', 120.00, 'hora', 'ACTIVE', true, true, true, 12, 1, 2, 'Vigilância em horário comercial'),
(gen_random_uuid(), 'Vigilância Noturna', 'Serviço de vigilância durante a noite', 'Vigilância', 'VIG-NOITE', 180.00, 'hora', 'ACTIVE', true, true, true, 12, 2, 3, 'Vigilância noturna com equipamentos especiais'),
(gen_random_uuid(), 'Portaria', 'Serviço de portaria e recepção', 'Portaria', 'PORT-01', 80.00, 'hora', 'ACTIVE', true, false, false, 8, 1, 1, 'Controle de acesso e recepção'),
(gen_random_uuid(), 'Ronda Externa', 'Ronda externa do perímetro', 'Ronda', 'RONDA-EXT', 100.00, 'hora', 'ACTIVE', true, true, true, 2, 1, 2, 'Ronda externa com equipamentos de comunicação'),
(gen_random_uuid(), 'Ronda Interna', 'Ronda interna das instalações', 'Ronda', 'RONDA-INT', 90.00, 'hora', 'ACTIVE', true, true, true, 1, 1, 2, 'Ronda interna com checklist'),
(gen_random_uuid(), 'Eventos Especiais', 'Vigilância para eventos especiais', 'Eventos', 'EVENT-01', 200.00, 'hora', 'ACTIVE', true, true, true, 8, 3, 6, 'Vigilância para eventos com maior contingente'),
(gen_random_uuid(), 'Escolta de Valores', 'Escolta de valores e documentos', 'Escolta', 'ESCOLTA-01', 300.00, 'hora', 'ACTIVE', true, true, true, 4, 2, 3, 'Escolta com veículo blindado'),
(gen_random_uuid(), 'Monitoramento CCTV', 'Monitoramento de câmeras de segurança', 'Monitoramento', 'CCTV-01', 60.00, 'hora', 'ACTIVE', true, true, false, 8, 1, 2, 'Monitoramento de câmeras 24h'),
(gen_random_uuid(), 'Consultoria em Segurança', 'Consultoria e assessoria em segurança', 'Consultoria', 'CONS-01', 500.00, 'hora', 'ACTIVE', true, false, true, 2, 1, 1, 'Consultoria especializada em segurança');
