CREATE TABLE unified_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payslip_id UUID REFERENCES payslips(id),
    receipt_id UUID REFERENCES payment_receipts(id),
    employee_id UUID REFERENCES employees(id),
    employee_name VARCHAR(255),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    unified_file_path VARCHAR(500),
    unified_file_name VARCHAR(255),
    matching_confidence NUMERIC(5,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Índices para melhor performance
CREATE INDEX idx_unified_documents_employee_id ON unified_documents(employee_id);
CREATE INDEX idx_unified_documents_month_year ON unified_documents(month, year);
CREATE INDEX idx_unified_documents_status ON unified_documents(status);
CREATE INDEX idx_unified_documents_created_at ON unified_documents(created_at);
