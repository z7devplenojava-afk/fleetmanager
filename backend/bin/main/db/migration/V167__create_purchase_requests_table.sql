-- Migration V287: Create purchase requests table
CREATE TABLE purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'DRAFT',
    requester_name VARCHAR(100),
    department VARCHAR(100),
    justification VARCHAR(100),
    estimated_total DECIMAL(10,2),
    urgency VARCHAR(20) DEFAULT 'NORMAL',
    required_date TIMESTAMP,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP,
    completion_date TIMESTAMP,
    approved_by VARCHAR(100),
    approval_notes VARCHAR(500),
    supplier VARCHAR(100),
    payment_method VARCHAR(20),
    delivery_method VARCHAR(20),
    delivery_address VARCHAR(200),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    notes VARCHAR(500),
    unit_id UUID,
    requester_id UUID,
    approver_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX idx_purchase_requests_number ON purchase_requests(request_number);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_priority ON purchase_requests(priority);
CREATE INDEX idx_purchase_requests_requester ON purchase_requests(requester_id);
CREATE INDEX idx_purchase_requests_approver ON purchase_requests(approver_id);
CREATE INDEX idx_purchase_requests_unit ON purchase_requests(unit_id);
CREATE INDEX idx_purchase_requests_date ON purchase_requests(request_date);