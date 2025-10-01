CREATE TABLE payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    employee_name VARCHAR(255),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    receipt_number VARCHAR(50),
    payment_date TIMESTAMP,
    gross_salary NUMERIC(10,2),
    net_salary NUMERIC(10,2),
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'PENDING',
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Índices para melhor performance
CREATE INDEX idx_payment_receipts_employee_id ON payment_receipts(employee_id);
CREATE INDEX idx_payment_receipts_month_year ON payment_receipts(month, year);
CREATE INDEX idx_payment_receipts_status ON payment_receipts(status);
CREATE INDEX idx_payment_receipts_created_at ON payment_receipts(created_at);
