-- Adição de campos para mapeamento visual de eixos nos pneus
ALTER TABLE tires ADD COLUMN axle_number INT;
ALTER TABLE tires ADD COLUMN position_index INT;

-- Tabela para registros de Arla 32 (específico para ônibus modernos)
CREATE TABLE arla_records (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    driver_id UUID,
    date DATE NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    mileage INT NOT NULL,
    station VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Planos de Manutenção Preventiva/Preditiva
CREATE TABLE maintenance_plans (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    interval_km INT,
    interval_days INT,
    last_execution_km INT,
    last_execution_date DATE,
    next_due_km INT,
    next_due_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ordens de Serviço de Frota (Gestão Operacional de Oficina)
CREATE TABLE fleet_work_orders (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    plan_id UUID,
    status VARCHAR(50) NOT NULL, -- DRAFT, PENDING_APPROVAL, APPROVED, IN_PROGRESS, COMPLETED
    priority VARCHAR(50) NOT NULL, -- LOW, MEDIUM, HIGH, URGENT
    mechanic_id UUID,
    labor_type VARCHAR(50), -- INTERNAL, EXTERNAL
    planned_date DATE,
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    total_cost DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Itens da Ordem de Serviço (Peças e Mão de Obra)
CREATE TABLE work_order_items (
    id UUID PRIMARY KEY,
    work_order_id UUID NOT NULL,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- PART, LABOR
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    product_id UUID, -- Link com inventário/produtos se disponível
    provider VARCHAR(255), -- Para serviços externos
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices básicos para performance
CREATE INDEX idx_arla_records_vehicle ON arla_records(vehicle_id);
CREATE INDEX idx_maintenance_plans_vehicle ON maintenance_plans(vehicle_id);
CREATE INDEX idx_fleet_work_orders_vehicle ON fleet_work_orders(vehicle_id);
CREATE INDEX idx_work_order_items_main ON work_order_items(work_order_id);
