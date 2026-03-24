-- V438: Criar tabelas para Controle de Horas Motorista e Parte Diária
-- Tabelas baseadas nas entidades DriverWorkHour, DriverHourCalculationMemory e DailyLog

-- ==========================================
-- TABELA: driver_work_hours
-- ==========================================
CREATE TABLE IF NOT EXISTS driver_work_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    reference_date DATE NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    total_minutes INTEGER,
    wait_minutes INTEGER,
    night_minutes INTEGER,
    overtime_minutes INTEGER,
    notes TEXT,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_driver_work_hours_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_driver_work_hours_employee ON driver_work_hours(employee_id);
CREATE INDEX IF NOT EXISTS idx_driver_work_hours_date ON driver_work_hours(reference_date);

-- ==========================================
-- TABELA: driver_hour_calculation_memories
-- ==========================================
CREATE TABLE IF NOT EXISTS driver_hour_calculation_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_work_hour_id UUID NOT NULL,
    calculation_log TEXT,
    applied_rules TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_driver_calculation_work_hour FOREIGN KEY (driver_work_hour_id) REFERENCES driver_work_hours(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_driver_calc_memory_work_hour ON driver_hour_calculation_memories(driver_work_hour_id);

-- ==========================================
-- TABELA: daily_logs (Parte Diária)
-- ==========================================
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    vehicle_id UUID NOT NULL,
    vehicle_plate VARCHAR(20),
    client_id UUID,
    route VARCHAR(100),
    shift VARCHAR(50),
    initial_km INTEGER NOT NULL,
    final_km INTEGER NOT NULL,
    total_km_run INTEGER NOT NULL,
    discounted_km INTEGER DEFAULT 0,
    considered_km INTEGER NOT NULL,
    allowance INTEGER DEFAULT 0,
    excess_km INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_daily_logs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_daily_logs_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_vehicle ON daily_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_client ON daily_logs(client_id);
