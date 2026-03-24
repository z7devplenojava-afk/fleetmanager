-- Migration V288: Create purchase request items table
CREATE TABLE purchase_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_request_id UUID NOT NULL,
    product_id UUID,
    item_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    specification VARCHAR(50),
    unit VARCHAR(20),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    brand VARCHAR(100),
    model VARCHAR(100),
    supplier VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'PENDING',
    justification VARCHAR(500),
    alternative_supplier VARCHAR(100),
    notes VARCHAR(500),
    urgency VARCHAR(20) DEFAULT 'NORMAL',
    current_stock DECIMAL(10,2),
    minimum_stock DECIMAL(10,2),
    stock_status VARCHAR(20),
    approved_by VARCHAR(100),
    approval_notes VARCHAR(500),
    rejected_by VARCHAR(100),
    rejection_reason VARCHAR(500),
    FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Indexes for better performance
CREATE INDEX idx_purchase_request_items_request ON purchase_request_items(purchase_request_id);
CREATE INDEX idx_purchase_request_items_product ON purchase_request_items(product_id);
CREATE INDEX idx_purchase_request_items_status ON purchase_request_items(status);
CREATE INDEX idx_purchase_request_items_priority ON purchase_request_items(priority);