CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    proposal_number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID,
    lead_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    total_value DECIMAL(15,2) NOT NULL,
    valid_until DATE,
    description TEXT,
    terms_conditions TEXT,
    notes TEXT,
    assigned_to_id UUID,
    created_by_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_client_id ON proposals(client_id);
CREATE INDEX idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX idx_proposals_assigned_to ON proposals(assigned_to_id);
CREATE INDEX idx_proposals_created_at ON proposals(created_at); 