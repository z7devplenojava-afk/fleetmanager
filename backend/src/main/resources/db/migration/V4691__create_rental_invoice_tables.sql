-- Migration V4691: Modulo Gestao de Locacao (faturas de locacao de veiculos)
-- Uma fatura pertence a um cliente e, opcionalmente, a um contrato de locacao.
-- Os itens da fatura sao apenas os veiculos locados (sem cessao de mao de obra).

CREATE TABLE IF NOT EXISTS rental_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(50) NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    contract_number VARCHAR(50),
    client_name VARCHAR(255),
    client_cnpj VARCHAR(30),
    client_ie VARCHAR(50),
    client_address VARCHAR(255),
    client_city VARCHAR(120),
    client_state VARCHAR(2),
    client_zip_code VARCHAR(20),
    issue_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(120),
    bank_name VARCHAR(120),
    bank_agency VARCHAR(30),
    bank_account VARCHAR(60),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rental_invoices_client ON rental_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_contract ON rental_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_status ON rental_invoices(status);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_due_date ON rental_invoices(due_date);

CREATE TABLE IF NOT EXISTS rental_invoice_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_invoice_id UUID NOT NULL REFERENCES rental_invoices(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    plate VARCHAR(20) NOT NULL,
    model VARCHAR(200),
    description VARCHAR(500),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rental_invoice_vehicles_invoice ON rental_invoice_vehicles(rental_invoice_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoice_vehicles_vehicle ON rental_invoice_vehicles(vehicle_id);

-- Permissao para os perfis operacionais (o frontend usa a matriz de itens do menu)
INSERT INTO permissions (id, name, description)
VALUES (gen_random_uuid(), 'RENTAL_MANAGEMENT_READ', 'Visualizar contratos de locacao, veiculos locados e faturas de locacao')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('SUPER_ADMIN', 'ADMIN', 'OPERACIONAL', 'GESTOR_OPERACIONAL')
  AND p.name = 'RENTAL_MANAGEMENT_READ'
ON CONFLICT DO NOTHING;
