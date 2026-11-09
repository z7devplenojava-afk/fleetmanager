-- Migration V4697: Despesas de Locacao de Veiculos (Responsabilidade do Cliente) e sincronizacao de alocacao

CREATE TABLE IF NOT EXISTS vehicle_rental_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    work_post_id UUID REFERENCES work_posts(id) ON DELETE SET NULL,
    work_post_name VARCHAR(255),
    contract_number VARCHAR(100),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(80) NOT NULL DEFAULT 'MANUTENCAO',
    description VARCHAR(500) NOT NULL,
    document_number VARCHAR(100),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    responsibility VARCHAR(50) NOT NULL DEFAULT 'CLIENTE',
    reimbursement_status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    notes TEXT,
    company_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_rental_expenses_vehicle ON vehicle_rental_expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_rental_expenses_client ON vehicle_rental_expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_rental_expenses_date ON vehicle_rental_expenses(expense_date);

-- Sincronizar veiculos que ja constam em faturas de locacao para preencher cliente, contrato e datas de alocacao
UPDATE vehicles v
SET
    client_id = COALESCE(v.client_id, sub.client_id),
    client_name = COALESCE(NULLIF(v.client_name, ''), sub.client_name),
    contract_id = COALESCE(v.contract_id, sub.contract_id),
    allocation_contract_number = COALESCE(NULLIF(v.allocation_contract_number, ''), sub.contract_number),
    allocation_start_date = COALESCE(v.allocation_start_date, sub.period_start),
    allocation_end_date = COALESCE(v.allocation_end_date, sub.period_end)
FROM (
    SELECT DISTINCT ON (UPPER(TRIM(riv.plate)))
        UPPER(TRIM(riv.plate)) AS plate_key,
        riv.vehicle_id,
        ri.client_id,
        ri.client_name,
        ri.contract_id,
        ri.contract_number,
        ri.period_start,
        ri.period_end
    FROM rental_invoice_vehicles riv
    JOIN rental_invoices ri ON ri.id = riv.rental_invoice_id
    ORDER BY UPPER(TRIM(riv.plate)), ri.issue_date DESC, ri.created_at DESC
) sub
WHERE UPPER(TRIM(v.plate)) = sub.plate_key
   OR (sub.vehicle_id IS NOT NULL AND v.id = sub.vehicle_id);

-- Vincular posto de trabalho / obra do cliente aos veiculos alocados ao cliente quando ainda nao definido
UPDATE vehicles v
SET
    work_post_id = wp_sub.wp_id,
    location = COALESCE(NULLIF(v.location, ''), wp_sub.wp_name)
FROM (
    SELECT DISTINCT ON (wp.client_id)
        wp.client_id,
        wp.id AS wp_id,
        wp.name AS wp_name
    FROM work_posts wp
    WHERE wp.client_id IS NOT NULL
    ORDER BY wp.client_id, wp.created_at DESC
) wp_sub
WHERE v.client_id = wp_sub.client_id
  AND v.work_post_id IS NULL;
