CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    quote_number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID,
    lead_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    total_value DECIMAL(15,2) NOT NULL,
    valid_until DATE,
    description TEXT,
    notes TEXT,
    estimated_duration VARCHAR(100),
    payment_terms VARCHAR(255),
    assigned_to_id UUID,
    created_by_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX idx_quotes_assigned_to ON quotes(assigned_to_id);
CREATE INDEX idx_quotes_created_at ON quotes(created_at); 