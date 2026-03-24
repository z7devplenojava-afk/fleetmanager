-- Migration V286: Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    code VARCHAR(50),
    barcode VARCHAR(50),
    category VARCHAR(50),
    brand VARCHAR(50),
    model VARCHAR(50),
    unit VARCHAR(20),
    cost_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    current_stock DECIMAL(10,2) DEFAULT 0,
    minimum_stock DECIMAL(10,2) DEFAULT 0,
    maximum_stock DECIMAL(10,2) DEFAULT 0,
    reorder_point DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    location VARCHAR(100),
    supplier VARCHAR(100),
    shelf_life VARCHAR(20),
    weight DECIMAL(10,2),
    weight_unit VARCHAR(20),
    dimensions VARCHAR(100),
    storage_conditions VARCHAR(20),
    notes VARCHAR(500),
    unit_id UUID,
    last_inventory_date TIMESTAMP,
    next_inventory_date TIMESTAMP,
    last_purchase_date TIMESTAMP,
    last_sale_date TIMESTAMP,
    average_consumption DECIMAL(10,2),
    consumption_period VARCHAR(20),
    safety_stock DECIMAL(10,2),
    lead_time DECIMAL(10,2),
    abc_classification VARCHAR(20),
    turnover_rate DECIMAL(10,2),
    days_of_inventory DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- Indexes for better performance
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_stock_status ON products(current_stock, minimum_stock);
CREATE INDEX idx_products_unit_id ON products(unit_id);
CREATE INDEX idx_products_supplier ON products(supplier);