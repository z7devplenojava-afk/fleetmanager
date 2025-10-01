CREATE TABLE proposal_items (
    id BIGSERIAL PRIMARY KEY,
    proposal_id BIGINT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id)
);

CREATE INDEX idx_proposal_items_proposal_id ON proposal_items(proposal_id); 