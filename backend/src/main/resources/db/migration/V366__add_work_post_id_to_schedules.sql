-- Add work_post_id column to schedules table
-- This column is optional and references the work_posts table
-- This migration also ensures the schedules table exists with all necessary columns

DO $$
BEGIN
    -- Check if the schedules table exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'schedules'
    ) THEN
        -- Create the table if it doesn't exist (safety migration)
        CREATE TABLE schedules (
            id UUID PRIMARY KEY,
            schedule_date DATE NOT NULL,
            shift VARCHAR(20) NOT NULL,
            location_id UUID NOT NULL,
            status VARCHAR(20) NOT NULL,
            route_id UUID,
            patrol_id UUID,
            employee_id UUID,
            work_post_id UUID,
            observations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Add foreign keys if the referenced tables exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
            ALTER TABLE schedules ADD CONSTRAINT fk_schedules_location 
                FOREIGN KEY (location_id) REFERENCES locations(id);
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
            ALTER TABLE schedules ADD CONSTRAINT fk_schedules_route 
                FOREIGN KEY (route_id) REFERENCES routes(id);
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patrols') THEN
            ALTER TABLE schedules ADD CONSTRAINT fk_schedules_patrol 
                FOREIGN KEY (patrol_id) REFERENCES patrols(id);
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
            ALTER TABLE schedules ADD CONSTRAINT fk_schedules_employee 
                FOREIGN KEY (employee_id) REFERENCES employees(id);
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_posts') THEN
            ALTER TABLE schedules ADD CONSTRAINT fk_schedules_work_post 
                FOREIGN KEY (work_post_id) REFERENCES work_posts(id) ON DELETE SET NULL;
        END IF;

        -- Create trigger for updated_at if function exists
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_schedules_updated_at
                BEFORE UPDATE ON schedules
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;

        -- Create basic indexes
        CREATE INDEX IF NOT EXISTS idx_schedules_location_id ON schedules(location_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_employee_id ON schedules(employee_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_work_post_id ON schedules(work_post_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_schedule_date ON schedules(schedule_date);
        CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

        RAISE NOTICE 'Tabela schedules criada com todas as colunas necessárias';
    ELSE
        -- Table exists, just add work_post_id if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'schedules' 
            AND column_name = 'work_post_id'
        ) THEN
            ALTER TABLE schedules ADD COLUMN work_post_id UUID;
            RAISE NOTICE 'Coluna work_post_id adicionada à tabela schedules';
        END IF;

        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_schedules_work_post'
            AND table_name = 'schedules'
        ) THEN
            IF EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_name = 'work_posts'
            ) THEN
                ALTER TABLE schedules 
                ADD CONSTRAINT fk_schedules_work_post 
                FOREIGN KEY (work_post_id) 
                REFERENCES work_posts(id) 
                ON DELETE SET NULL;
                RAISE NOTICE 'Foreign key fk_schedules_work_post criada';
            END IF;
        END IF;

        -- Create index for better query performance
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE tablename = 'schedules' 
            AND indexname = 'idx_schedules_work_post_id'
        ) THEN
            CREATE INDEX idx_schedules_work_post_id ON schedules(work_post_id);
            RAISE NOTICE 'Índice idx_schedules_work_post_id criado';
        END IF;
    END IF;

    -- Add comment if column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND column_name = 'work_post_id'
    ) THEN
        COMMENT ON COLUMN schedules.work_post_id IS 'Optional reference to the work post assigned to this schedule';
    END IF;
END $$;

