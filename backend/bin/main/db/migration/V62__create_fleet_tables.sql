-- Criação da tabela de veículos (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
        CREATE TABLE vehicles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    END IF;
END $$;

-- Criação da tabela de registros de abastecimento (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_records') THEN
        CREATE TABLE fuel_records (
            id UUID PRIMARY KEY,
            vehicle_id UUID NOT NULL,
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
    END IF;
END $$;

-- Criação da tabela de multas (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fines') THEN
        CREATE TABLE fines (
            id UUID PRIMARY KEY,
            vehicle_id UUID NOT NULL,
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
    END IF;
END $$;

-- Criação de índices para melhor performance (idempotentes)
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON vehicles(fuel_type);

CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle_id ON fuel_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(date);
CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle_date ON fuel_records(vehicle_id, date);

CREATE INDEX IF NOT EXISTS idx_fines_vehicle_id ON fines(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_fines_date ON fines(date);
CREATE INDEX IF NOT EXISTS idx_fines_due_date ON fines(due_date);

-- Inserção de dados de exemplo (idempotente - apenas se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE plate = 'ABC1234') THEN
        INSERT INTO vehicles (plate, model, brand, year, color, status, fuel_type, capacity, current_mileage) VALUES
        ('ABC1234', 'Civic', 'Honda', 2020, 'Prata', 'ACTIVE', 'FLEX', 5, 45000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE plate = 'DEF5678') THEN
        INSERT INTO vehicles (plate, model, brand, year, color, status, fuel_type, capacity, current_mileage) VALUES
        ('DEF5678', 'Corolla', 'Toyota', 2019, 'Branco', 'ACTIVE', 'FLEX', 5, 38000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE plate = 'GHI9012') THEN
        INSERT INTO vehicles (plate, model, brand, year, color, status, fuel_type, capacity, current_mileage) VALUES
        ('GHI9012', 'Hilux', 'Toyota', 2021, 'Prata', 'ACTIVE', 'DIESEL', 5, 25000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE plate = 'JKL3456') THEN
        INSERT INTO vehicles (plate, model, brand, year, color, status, fuel_type, capacity, current_mileage) VALUES
        ('JKL3456', 'Ranger', 'Ford', 2020, 'Branco', 'MAINTENANCE', 'DIESEL', 5, 55000);
    END IF;
END $$;

-- Inserção de registros de abastecimento de exemplo (idempotente - protegido por subquery)
DO $$
DECLARE
    vehicle_abc_id UUID;
    vehicle_def_id UUID;
    vehicle_ghi_id UUID;
BEGIN
    SELECT id INTO vehicle_abc_id FROM vehicles WHERE plate = 'ABC1234' LIMIT 1;
    SELECT id INTO vehicle_def_id FROM vehicles WHERE plate = 'DEF5678' LIMIT 1;
    SELECT id INTO vehicle_ghi_id FROM vehicles WHERE plate = 'GHI9012' LIMIT 1;

    IF vehicle_abc_id IS NOT NULL THEN
        INSERT INTO fuel_records (id, vehicle_id, date, fuel_type, quantity, cost, mileage, station, notes)
        SELECT gen_random_uuid(), vehicle_abc_id, '2024-01-15', 'GASOLINE', 45.5, 250.25, 45000, 'Posto Shell', 'Abastecimento completo'
        WHERE NOT EXISTS (SELECT 1 FROM fuel_records WHERE vehicle_id = vehicle_abc_id AND date = '2024-01-15' AND mileage = 45000);
        
        INSERT INTO fuel_records (id, vehicle_id, date, fuel_type, quantity, cost, mileage, station, notes)
        SELECT gen_random_uuid(), vehicle_abc_id, '2024-01-20', 'ETHANOL', 50.0, 200.00, 45500, 'Posto Ipiranga', 'Abastecimento parcial'
        WHERE NOT EXISTS (SELECT 1 FROM fuel_records WHERE vehicle_id = vehicle_abc_id AND date = '2024-01-20' AND mileage = 45500);
    END IF;

    IF vehicle_def_id IS NOT NULL THEN
        INSERT INTO fuel_records (id, vehicle_id, date, fuel_type, quantity, cost, mileage, station, notes)
        SELECT gen_random_uuid(), vehicle_def_id, '2024-01-18', 'GASOLINE', 40.0, 220.00, 38000, 'Posto Petrobras', 'Abastecimento completo'
        WHERE NOT EXISTS (SELECT 1 FROM fuel_records WHERE vehicle_id = vehicle_def_id AND date = '2024-01-18' AND mileage = 38000);
    END IF;

    IF vehicle_ghi_id IS NOT NULL THEN
        INSERT INTO fuel_records (id, vehicle_id, date, fuel_type, quantity, cost, mileage, station, notes)
        SELECT gen_random_uuid(), vehicle_ghi_id, '2024-01-22', 'DIESEL', 60.0, 300.00, 25000, 'Posto Shell', 'Abastecimento completo'
        WHERE NOT EXISTS (SELECT 1 FROM fuel_records WHERE vehicle_id = vehicle_ghi_id AND date = '2024-01-22' AND mileage = 25000);
    END IF;
END $$;

-- Inserção de multas de exemplo (idempotente)
DO $$
DECLARE
    vehicle_abc_id UUID;
    vehicle_def_id UUID;
    vehicle_ghi_id UUID;
BEGIN
    SELECT id INTO vehicle_abc_id FROM vehicles WHERE plate = 'ABC1234' LIMIT 1;
    SELECT id INTO vehicle_def_id FROM vehicles WHERE plate = 'DEF5678' LIMIT 1;
    SELECT id INTO vehicle_ghi_id FROM vehicles WHERE plate = 'GHI9012' LIMIT 1;

    IF vehicle_abc_id IS NOT NULL THEN
        INSERT INTO fines (id, vehicle_id, date, description, amount, location, status, due_date)
        SELECT gen_random_uuid(), vehicle_abc_id, '2024-01-10', 'Excesso de velocidade', 293.47, 'Av. Paulista, São Paulo - SP', 'PENDING', '2024-02-10'
        WHERE NOT EXISTS (SELECT 1 FROM fines WHERE vehicle_id = vehicle_abc_id AND date = '2024-01-10' AND description = 'Excesso de velocidade');
    END IF;

    IF vehicle_def_id IS NOT NULL THEN
        INSERT INTO fines (id, vehicle_id, date, description, amount, location, status, due_date)
        SELECT gen_random_uuid(), vehicle_def_id, '2024-01-12', 'Estacionamento irregular', 88.38, 'Rua Augusta, São Paulo - SP', 'PAID', '2024-02-12'
        WHERE NOT EXISTS (SELECT 1 FROM fines WHERE vehicle_id = vehicle_def_id AND date = '2024-01-12' AND description = 'Estacionamento irregular');
    END IF;

    IF vehicle_ghi_id IS NOT NULL THEN
        INSERT INTO fines (id, vehicle_id, date, description, amount, location, status, due_date)
        SELECT gen_random_uuid(), vehicle_ghi_id, '2024-01-15', 'Sinal vermelho', 293.47, 'Av. Brigadeiro Faria Lima, São Paulo - SP', 'PENDING', '2024-02-15'
        WHERE NOT EXISTS (SELECT 1 FROM fines WHERE vehicle_id = vehicle_ghi_id AND date = '2024-01-15' AND description = 'Sinal vermelho');
    END IF;
END $$;
