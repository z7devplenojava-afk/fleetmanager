-- Migration V447: Add company_id to remaining central tables
-- Supporting multi-tenant isolation for Clients, Employees, Suppliers, Vehicles and Routes

-- 1. clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);

-- 2. employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);

-- 3. suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON suppliers(company_id);

-- 4. vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id);

-- 5. routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_routes_company_id ON routes(company_id);

-- Add foreign keys for data integrity
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_clients_company') THEN
        ALTER TABLE clients ADD CONSTRAINT fk_clients_company FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employees_company') THEN
        ALTER TABLE employees ADD CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_suppliers_company') THEN
        ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_company FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_vehicles_company') THEN
        ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_company FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_routes_company') THEN
        ALTER TABLE routes ADD CONSTRAINT fk_routes_company FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
END $$;
