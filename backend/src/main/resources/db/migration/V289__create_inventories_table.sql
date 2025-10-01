-- Migration V289: Create inventories table
CREATE TABLE inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_number VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    type VARCHAR(20) DEFAULT 'FULL',
    status VARCHAR(20) DEFAULT 'PLANNED',
    planned_date TIMESTAMP,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    completion_date TIMESTAMP,
    responsible_person VARCHAR(100),
    department VARCHAR(100),
    location VARCHAR(100),
    total_items DECIMAL(10,2),
    counted_items DECIMAL(10,2),
    variance_items DECIMAL(10,2),
    total_value DECIMAL(10,2),
    counted_value DECIMAL(10,2),
    variance_value DECIMAL(10,2),
    accuracy_percentage DECIMAL(5,2),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    notes VARCHAR(500),
    approved_by VARCHAR(100),
    approval_date TIMESTAMP,
    approval_notes VARCHAR(500),
    unit_id UUID,
    responsible_id UUID,
    approver_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (responsible_id) REFERENCES users(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX idx_inventories_number ON inventories(inventory_number);
CREATE INDEX idx_inventories_status ON inventories(status);
CREATE INDEX idx_inventories_type ON inventories(type);
CREATE INDEX idx_inventories_responsible ON inventories(responsible_id);
CREATE INDEX idx_inventories_unit ON inventories(unit_id);
CREATE INDEX idx_inventories_date ON inventories(planned_date);