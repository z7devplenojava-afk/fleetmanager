-- Criação da tabela de movimentações de estoque
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_value DECIMAL(10,2),
    reason VARCHAR(200),
    requester VARCHAR(100),
    approved_by VARCHAR(100),
    employee_id VARCHAR(50),
    employee_name VARCHAR(100),
    department VARCHAR(100),
    location VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) NOT NULL,
    movement_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_inventory_movements_item_id ON inventory_movements(item_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX idx_inventory_movements_status ON inventory_movements(status);
CREATE INDEX idx_inventory_movements_movement_date ON inventory_movements(movement_date);
CREATE INDEX idx_inventory_movements_employee_name ON inventory_movements(employee_name);
CREATE INDEX idx_inventory_movements_department ON inventory_movements(department);
CREATE INDEX idx_inventory_movements_location ON inventory_movements(location); 