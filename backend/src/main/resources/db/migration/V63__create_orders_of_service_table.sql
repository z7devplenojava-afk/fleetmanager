CREATE TABLE orders_of_service (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_cpf VARCHAR(14) NOT NULL,
    role VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    workplace VARCHAR(255) NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    document_url VARCHAR(500),
    signed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_id ON orders_of_service (employee_id);
CREATE INDEX idx_signed ON orders_of_service (signed);
CREATE INDEX idx_start_date ON orders_of_service (start_date);
CREATE INDEX idx_company ON orders_of_service (company);
CREATE INDEX idx_client ON orders_of_service (client); 