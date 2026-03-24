CREATE TABLE IF NOT EXISTS leaves (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(500) NOT NULL,
    document_url VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    approved_by UUID,
    approval_date TIMESTAMP,
    justification VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
); 