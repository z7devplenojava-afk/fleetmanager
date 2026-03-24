-- V435: Criar tabelas para gestão de turnos de motoristas e execução de rotas
-- Permite personalização de turnos, rastreamento de tempo real e realocação dinâmica

-- ==========================================
-- TABELA: driver_shifts (Turnos dos Motoristas)
-- ==========================================
CREATE TABLE IF NOT EXISTS driver_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL,
    vehicle_id UUID,
    shift_date DATE NOT NULL,

    -- Horários planejados
    planned_start_time TIME NOT NULL,
    planned_end_time TIME NOT NULL,

    -- Horários reais
    actual_start_time TIME,
    actual_end_time TIME,

    -- Intervalo/pausa
    break_start_time TIME,
    break_end_time TIME,

    -- Cálculos de disponibilidade
    total_shift_hours DOUBLE PRECISION,
    hours_used DOUBLE PRECISION DEFAULT 0,
    hours_remaining DOUBLE PRECISION DEFAULT 0,

    -- Localização atual do motorista
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    current_location_name VARCHAR(200),

    -- Status e controle
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    observations VARCHAR(1000),
    available_for_reallocation BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_driver_shifts_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_driver_shifts_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver_date ON driver_shifts(driver_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_date ON driver_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_status ON driver_shifts(status);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_available ON driver_shifts(available_for_reallocation, shift_date)
    WHERE available_for_reallocation = TRUE;

-- ==========================================
-- TABELA: route_executions (Execuções de Rotas)
-- ==========================================
CREATE TABLE IF NOT EXISTS route_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_shift_id UUID NOT NULL,
    route_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    vehicle_id UUID,

    -- Horários planejados
    planned_start_time TIME,
    planned_end_time TIME,

    -- Horários reais
    actual_start_time TIME,
    actual_end_time TIME,

    -- Durações
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    time_difference_minutes INTEGER,

    -- Quilometragem
    estimated_km DOUBLE PRECISION,
    actual_km DOUBLE PRECISION,

    -- Controle
    is_reallocation BOOLEAN NOT NULL DEFAULT FALSE,
    execution_order INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    observations VARCHAR(1000),

    -- Coordenadas de início/fim reais
    start_latitude DOUBLE PRECISION,
    start_longitude DOUBLE PRECISION,
    end_latitude DOUBLE PRECISION,
    end_longitude DOUBLE PRECISION,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_route_exec_shift FOREIGN KEY (driver_shift_id) REFERENCES driver_shifts(id) ON DELETE CASCADE,
    CONSTRAINT fk_route_exec_route FOREIGN KEY (route_id) REFERENCES routes(id),
    CONSTRAINT fk_route_exec_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_route_exec_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_route_exec_shift ON route_executions(driver_shift_id);
CREATE INDEX IF NOT EXISTS idx_route_exec_route ON route_executions(route_id);
CREATE INDEX IF NOT EXISTS idx_route_exec_driver_date ON route_executions(driver_id);
CREATE INDEX IF NOT EXISTS idx_route_exec_status ON route_executions(status);

-- Adicionar campos de horário programado na rota (início/fim da operação)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS scheduled_start_time TIME;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS garage_latitude DOUBLE PRECISION;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS garage_longitude DOUBLE PRECISION;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS garage_name VARCHAR(200);
