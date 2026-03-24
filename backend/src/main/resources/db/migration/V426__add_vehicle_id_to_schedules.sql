-- Migration V426: Add vehicle_id to schedules table
-- Support for vehicle assignments in schedules

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'vehicle_id') THEN
        ALTER TABLE schedules ADD COLUMN vehicle_id UUID;
        
        -- Add foreign key constraint if vehicles table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
            ALTER TABLE schedules 
            ADD CONSTRAINT fk_schedules_vehicle 
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
            ON DELETE SET NULL;
        END IF;
        
        RAISE NOTICE 'Coluna vehicle_id adicionada à tabela schedules';
    END IF;
END $$;
