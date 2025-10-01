CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    source VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    description TEXT,
    notes TEXT,
    estimated_value DECIMAL(15,2),
    assigned_to_id UUID,
    created_by_id UUID NOT NULL,
    next_follow_up TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to_id);
CREATE INDEX idx_leads_created_at ON leads(created_at); 