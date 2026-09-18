-- Migration: V4588__add_client_id_and_client_portal_tables.sql
-- Description: Suporte a clientes no login/usuários, tickets e solicitações do Portal do Cliente

-- 1. Adicionar client_id à tabela users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE users ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);

-- 2. Adicionar client_id à tabela support_tickets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'support_tickets' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE support_tickets ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_support_tickets_client_id ON support_tickets(client_id);

-- 3. Atualizar restrição de categoria em support_tickets para suportar categorias do Portal do Cliente
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS check_ticket_category;

-- 4. Criar tabela de solicitações do cliente (veículo reserva, viagem extra, etc)
CREATE TABLE IF NOT EXISTS client_service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    request_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reason TEXT,
    has_contract_reserve_clause BOOLEAN,
    is_extra_reserve BOOLEAN,
    affected_vehicle_plate VARCHAR(20),
    origin VARCHAR(255),
    destination VARCHAR(255),
    departure_date_time TIMESTAMP,
    return_date_time TIMESTAMP,
    passenger_count INTEGER,
    vehicle_type_needed VARCHAR(100),
    requested_by_user_id UUID,
    requested_by_user_name VARCHAR(255),
    assigned_vehicle_plate VARCHAR(20),
    assigned_driver_name VARCHAR(255),
    response_notes TEXT,
    rejection_reason TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_service_requests_company ON client_service_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_client_service_requests_client ON client_service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_client_service_requests_status ON client_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_service_requests_type ON client_service_requests(request_type);
