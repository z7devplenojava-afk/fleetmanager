-- Criação da tabela de veículos
CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    plate VARCHAR(10) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    fuel_type VARCHAR(20) NOT NULL,
    capacity INTEGER NOT NULL,
    current_mileage INTEGER NOT NULL DEFAULT 0,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    insurance_expiry_date DATE,
    documentation_expiry_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de registros de abastecimento
CREATE TABLE fuel_records (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    date DATE NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    mileage INTEGER NOT NULL,
    station VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Criação da tabela de multas
CREATE TABLE fines (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    location VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date DATE,
    payment_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Criação de índices para melhor performance
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_fuel_type ON vehicles(fuel_type);

CREATE INDEX idx_fuel_records_vehicle_id ON fuel_records(vehicle_id);
CREATE INDEX idx_fuel_records_date ON fuel_records(date);
CREATE INDEX idx_fuel_records_vehicle_date ON fuel_records(vehicle_id, date);

CREATE INDEX idx_fines_vehicle_id ON fines(vehicle_id);
CREATE INDEX idx_fines_status ON fines(status);
CREATE INDEX idx_fines_date ON fines(date);
CREATE INDEX idx_fines_due_date ON fines(due_date);

-- Inserção de dados de exemplo
INSERT INTO vehicles (plate, model, brand, year, color, status, fuel_type, capacity, current_mileage) VALUES
('ABC1234', 'Civic', 'Honda', 2020, 'Prata', 'ACTIVE', 'FLEX', 5, 45000),
('DEF5678', 'Corolla', 'Toyota', 2019, 'Branco', 'ACTIVE', 'FLEX', 5, 38000),
('GHI9012', 'Hilux', 'Toyota', 2021, 'Prata', 'ACTIVE', 'DIESEL', 5, 25000),
('JKL3456', 'Ranger', 'Ford', 2020, 'Branco', 'MAINTENANCE', 'DIESEL', 5, 55000);

-- Inserção de registros de abastecimento de exemplo
INSERT INTO fuel_records (vehicle_id, date, fuel_type, quantity, cost, mileage, station, notes) VALUES
(1, '2024-01-15', 'GASOLINE', 45.5, 250.25, 45000, 'Posto Shell', 'Abastecimento completo'),
(1, '2024-01-20', 'ETHANOL', 50.0, 200.00, 45500, 'Posto Ipiranga', 'Abastecimento parcial'),
(2, '2024-01-18', 'GASOLINE', 40.0, 220.00, 38000, 'Posto Petrobras', 'Abastecimento completo'),
(3, '2024-01-22', 'DIESEL', 60.0, 300.00, 25000, 'Posto Shell', 'Abastecimento completo');

-- Inserção de multas de exemplo
INSERT INTO fines (vehicle_id, date, description, amount, location, status, due_date) VALUES
(1, '2024-01-10', 'Excesso de velocidade', 293.47, 'Av. Paulista, São Paulo - SP', 'PENDING', '2024-02-10'),
(2, '2024-01-12', 'Estacionamento irregular', 88.38, 'Rua Augusta, São Paulo - SP', 'PAID', '2024-02-12'),
(3, '2024-01-15', 'Sinal vermelho', 293.47, 'Av. Brigadeiro Faria Lima, São Paulo - SP', 'PENDING', '2024-02-15'); 