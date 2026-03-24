-- Criação da tabela de itens de estoque
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(30) NOT NULL,
    type VARCHAR(30) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    size VARCHAR(20),
    color VARCHAR(50),
    material VARCHAR(100),
    quantity INTEGER NOT NULL,
    minimum_quantity INTEGER NOT NULL,
    maximum_quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_value DECIMAL(10,2),
    location VARCHAR(100),
    shelf VARCHAR(50),
    barcode VARCHAR(50),
    sku VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    purchase_date DATE,
    expiry_date DATE,
    supplier VARCHAR(200),
    supplier_contact VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_type ON inventory_items(type);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_name ON inventory_items(name);
CREATE INDEX idx_inventory_items_brand ON inventory_items(brand);
CREATE INDEX idx_inventory_items_size ON inventory_items(size);
CREATE INDEX idx_inventory_items_color ON inventory_items(color);
CREATE INDEX idx_inventory_items_location ON inventory_items(location);
CREATE INDEX idx_inventory_items_supplier ON inventory_items(supplier); 