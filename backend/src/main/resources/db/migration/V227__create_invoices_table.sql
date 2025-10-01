CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    client_id BIGINT REFERENCES clients(id),
    contract_id BIGINT REFERENCES contracts(id),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
); 