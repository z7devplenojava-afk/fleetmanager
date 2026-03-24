-- Criação da tabela de locais (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
        CREATE TABLE locations (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            address VARCHAR(255) NOT NULL,
            unit_id UUID NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (unit_id) REFERENCES units(id)
        );
    END IF;
END $$;

-- Criação da tabela de rotas (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
        CREATE TABLE routes (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            unit_id UUID NOT NULL,
            location_id UUID NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (unit_id) REFERENCES units(id),
            FOREIGN KEY (location_id) REFERENCES locations(id)
        );
    END IF;
END $$;

-- Criação da tabela de rondas (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patrols') THEN
        CREATE TABLE patrols (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            route_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP,
            observations TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (route_id) REFERENCES routes(id),
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
    END IF;
END $$;

-- Criação da tabela de turnos (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts') THEN
        CREATE TABLE shifts (
            id UUID PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Criação da tabela de escalas (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
        CREATE TABLE schedules (
            id UUID PRIMARY KEY,
            schedule_date DATE NOT NULL,
            shift VARCHAR(20) NOT NULL,
            location_id UUID NOT NULL,
            status VARCHAR(20) NOT NULL,
            route_id UUID,
            patrol_id UUID,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (location_id) REFERENCES locations(id),
            FOREIGN KEY (route_id) REFERENCES routes(id),
            FOREIGN KEY (patrol_id) REFERENCES patrols(id)
        );
    END IF;
END $$;

-- Criação da tabela de escalas de funcionários (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedule_employees') THEN
        CREATE TABLE schedule_employees (
            id UUID PRIMARY KEY,
            schedule_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            position_id UUID NOT NULL,
            visual_order INTEGER NOT NULL,
            observations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (schedule_id) REFERENCES schedules(id),
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (position_id) REFERENCES positions(id)
        );
    END IF;
END $$;

-- Triggers para atualizar o updated_at (idempotentes)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
        DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_locations_updated_at
                BEFORE UPDATE ON locations
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
        DROP TRIGGER IF EXISTS update_routes_updated_at ON routes;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_routes_updated_at
                BEFORE UPDATE ON routes
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patrols') THEN
        DROP TRIGGER IF EXISTS update_patrols_updated_at ON patrols;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_patrols_updated_at
                BEFORE UPDATE ON patrols
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts') THEN
        DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_shifts_updated_at
                BEFORE UPDATE ON shifts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
        DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_schedules_updated_at
                BEFORE UPDATE ON schedules
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedule_employees') THEN
        DROP TRIGGER IF EXISTS update_schedule_employees_updated_at ON schedule_employees;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_schedule_employees_updated_at
                BEFORE UPDATE ON schedule_employees
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;
