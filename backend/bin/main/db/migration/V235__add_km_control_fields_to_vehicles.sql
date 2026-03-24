-- Adicionar novos campos para controle de km na tabela vehicles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'initial_mileage'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN initial_mileage INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'average_consumption'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN average_consumption DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'average_cost_per_km'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN average_cost_per_km DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'assigned_driver'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN assigned_driver VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'department'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN department VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'location'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN location VARCHAR(200);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'notes'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN notes TEXT;
    END IF;
END
$$;

-- Índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_driver ON vehicles(assigned_driver);
CREATE INDEX IF NOT EXISTS idx_vehicles_department ON vehicles(department);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_average_consumption ON vehicles(average_consumption);
CREATE INDEX IF NOT EXISTS idx_vehicles_average_cost_per_km ON vehicles(average_cost_per_km);