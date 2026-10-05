-- PRD Viasao Sao Silvestre - Fase 1: Horarios de partida por linha e tipo de dia
CREATE TABLE IF NOT EXISTS line_time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    route_id UUID NOT NULL,
    day_type VARCHAR(20) NOT NULL,
    departure_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_line_time_slots_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    CONSTRAINT fk_line_time_slots_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT chk_line_time_slots_day_type CHECK (day_type IN ('DIA_UTIL', 'SABADO', 'DOMINGO_FERIADO')),
    CONSTRAINT chk_line_time_slots_status CHECK (status IN ('ATIVO', 'INATIVO'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_line_time_slots_route_day_time
    ON line_time_slots(route_id, day_type, departure_time);
CREATE INDEX IF NOT EXISTS idx_line_time_slots_company ON line_time_slots(company_id);
CREATE INDEX IF NOT EXISTS idx_line_time_slots_route ON line_time_slots(route_id);

-- Excecoes de calendario: em uma data especifica, utilizar os horarios de outro tipo de dia
-- (ex.: feriado -> utilizar horarios de DOMINGO_FERIADO)
CREATE TABLE IF NOT EXISTS schedule_date_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    override_date DATE NOT NULL,
    applies_day_type VARCHAR(20) NOT NULL,
    reason VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_schedule_date_overrides_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT chk_schedule_date_overrides_day_type CHECK (applies_day_type IN ('DIA_UTIL', 'SABADO', 'DOMINGO_FERIADO'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_schedule_date_overrides_date
    ON schedule_date_overrides(override_date);
CREATE INDEX IF NOT EXISTS idx_schedule_date_overrides_company ON schedule_date_overrides(company_id);
