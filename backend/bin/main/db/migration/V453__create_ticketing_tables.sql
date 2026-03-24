-- V453: Criar tabelas para Gestão de Passagens (Venda Individual)
-- Tabelas renomeadas para evitar conflito com 'trips' operacional existente

-- 1. Templates de Mapa de Poltronas
CREATE TABLE IF NOT EXISTS seat_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    vehicle_type VARCHAR(50) NOT NULL, -- CONVENCIONAL, LEITO, DD, etc.
    total_seats INTEGER NOT NULL,
    layout_json JSONB NOT NULL, -- Estrutura visual das poltronas e corredor
    company_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_seat_templates_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 2. Tabela de Viagens Regulares (Venda Individual)
CREATE TABLE IF NOT EXISTS regular_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_code VARCHAR(50) UNIQUE NOT NULL,
    route_id UUID NOT NULL,
    vehicle_id UUID,
    driver_id UUID,
    seat_template_id UUID NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP,
    base_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, IN_TRANSIT, COMPLETED, CANCELLED
    company_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_regular_trips_route FOREIGN KEY (route_id) REFERENCES routes(id),
    CONSTRAINT fk_regular_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_regular_trips_driver FOREIGN KEY (driver_id) REFERENCES employees(id),
    CONSTRAINT fk_regular_trips_template FOREIGN KEY (seat_template_id) REFERENCES seat_templates(id),
    CONSTRAINT fk_regular_trips_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 3. Tabela de Passagens (Tickets)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regular_trip_id UUID NOT NULL,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    passenger_name VARCHAR(200) NOT NULL,
    passenger_document VARCHAR(20) NOT NULL,
    passenger_email VARCHAR(200),
    passenger_phone VARCHAR(20),
    sale_price DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RESERVED', -- RESERVED, PAID, CANCELLED, USED
    payment_method VARCHAR(50),
    payment_id VARCHAR(100),
    company_id UUID NOT NULL,
    issued_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_tickets_regular_trip FOREIGN KEY (regular_trip_id) REFERENCES regular_trips(id),
    CONSTRAINT fk_tickets_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_regular_trips_departure ON regular_trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_regular_trips_route_id ON regular_trips(route_id);
CREATE INDEX IF NOT EXISTS idx_regular_trips_company_id ON regular_trips(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_trip_id ON tickets(regular_trip_id);
CREATE INDEX IF NOT EXISTS idx_tickets_passenger_doc ON tickets(passenger_document);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
