-- PRD Viasao Sao Silvestre - Fase 2: escalas operacionais (agenda diaria por linha/horario)
CREATE TABLE IF NOT EXISTS escalas_operacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    scale_date DATE NOT NULL,
    route_id UUID NOT NULL,
    time_slot_id UUID,
    departure_time TIME NOT NULL,
    vehicle_id UUID,
    driver_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANEJADA',
    origin VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    trip_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_escalas_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_escalas_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    CONSTRAINT fk_escalas_time_slot FOREIGN KEY (time_slot_id) REFERENCES line_time_slots(id) ON DELETE SET NULL,
    CONSTRAINT fk_escalas_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    CONSTRAINT fk_escalas_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    CONSTRAINT fk_escalas_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    CONSTRAINT chk_escalas_status CHECK (status IN ('PLANEJADA', 'CONFIRMADA', 'EXECUTANDO', 'CONCLUIDA', 'CANCELADA')),
    CONSTRAINT chk_escalas_origin CHECK (origin IN ('MANUAL', 'GERADA'))
);

CREATE INDEX IF NOT EXISTS idx_escalas_date ON escalas_operacionais(scale_date);
CREATE INDEX IF NOT EXISTS idx_escalas_company ON escalas_operacionais(company_id);
CREATE INDEX IF NOT EXISTS idx_escalas_route ON escalas_operacionais(route_id);
CREATE INDEX IF NOT EXISTS idx_escalas_driver_date ON escalas_operacionais(driver_id, scale_date);
CREATE INDEX IF NOT EXISTS idx_escalas_vehicle_date ON escalas_operacionais(vehicle_id, scale_date);
