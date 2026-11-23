-- ===========================================================================
-- V4724: Adiciona ON DELETE SET NULL para as chaves estrangeiras que referenciam
--        a tabela 'drivers'. Isso permite a exclusão ou inativação de motoristas
--        sem quebrar registros históricos de checklists, multas, abastecimentos, etc.
-- ===========================================================================

-- 1. vehicle_gate_checklists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'vehicle_gate_checklists' AND constraint_name = 'vehicle_gate_checklists_driver_id_fkey'
    ) THEN
        ALTER TABLE vehicle_gate_checklists DROP CONSTRAINT vehicle_gate_checklists_driver_id_fkey;
    END IF;
    ALTER TABLE vehicle_gate_checklists 
        ADD CONSTRAINT fk_gate_checklist_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
END $$;

-- 2. client_checklist_records
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'client_checklist_records' AND constraint_name = 'client_checklist_records_driver_id_fkey'
    ) THEN
        ALTER TABLE client_checklist_records DROP CONSTRAINT client_checklist_records_driver_id_fkey;
    END IF;
    ALTER TABLE client_checklist_records 
        ADD CONSTRAINT fk_client_checklist_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
END $$;

-- 3. fines
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'fines' AND constraint_name = 'fk_fines_driver'
    ) THEN
        ALTER TABLE fines DROP CONSTRAINT fk_fines_driver;
    END IF;
    ALTER TABLE fines 
        ADD CONSTRAINT fk_fines_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
END $$;

-- 4. fuel_records
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'fuel_records' AND constraint_name = 'fk_fuelrecord_driver'
    ) THEN
        ALTER TABLE fuel_records DROP CONSTRAINT fk_fuelrecord_driver;
    END IF;
    ALTER TABLE fuel_records 
        ADD CONSTRAINT fk_fuelrecord_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
END $$;

-- 5. driver_shifts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'driver_shifts' AND constraint_name = 'fk_driver_shifts_driver'
    ) THEN
        ALTER TABLE driver_shifts DROP CONSTRAINT fk_driver_shifts_driver;
    END IF;
    ALTER TABLE driver_shifts 
        ADD CONSTRAINT fk_driver_shifts_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
END $$;

-- 6. route_executions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'route_executions' AND constraint_name = 'fk_route_exec_driver'
    ) THEN
        ALTER TABLE route_executions DROP CONSTRAINT fk_route_exec_driver;
    END IF;
    ALTER TABLE route_executions 
        ADD CONSTRAINT fk_route_exec_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
END $$;

-- 7. vehicle_cleaning_orders
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'vehicle_cleaning_orders' AND constraint_name = 'vehicle_cleaning_orders_driver_id_fkey'
    ) THEN
        ALTER TABLE vehicle_cleaning_orders DROP CONSTRAINT vehicle_cleaning_orders_driver_id_fkey;
    END IF;
    ALTER TABLE vehicle_cleaning_orders 
        ADD CONSTRAINT fk_cleaning_orders_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
END $$;

-- 8. lavajato_services
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'lavajato_services' AND constraint_name = 'lavajato_services_driver_id_fkey'
    ) THEN
        ALTER TABLE lavajato_services DROP CONSTRAINT lavajato_services_driver_id_fkey;
    END IF;
    ALTER TABLE lavajato_services 
        ADD CONSTRAINT fk_lavajato_services_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
END $$;
