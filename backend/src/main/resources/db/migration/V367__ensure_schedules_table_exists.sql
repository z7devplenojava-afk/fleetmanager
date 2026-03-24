-- Migration de segurança: Garantir que a tabela schedules existe com todas as colunas necessárias
-- Esta migration cria a tabela schedules se ela não existir, incluindo todas as colunas necessárias

DO $$
BEGIN
    -- Verificar se a tabela schedules existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'schedules'
    ) THEN
        -- Criar a tabela schedules com todas as colunas necessárias
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
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (location_id) REFERENCES locations(id),
            FOREIGN KEY (route_id) REFERENCES routes(id),
            FOREIGN KEY (patrol_id) REFERENCES patrols(id)
        );

        -- Adicionar foreign key para employee_id se a tabela employees existir
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'employees'
        ) THEN
            ALTER TABLE schedules 
            ADD CONSTRAINT fk_schedules_employee 
            FOREIGN KEY (employee_id) 
            REFERENCES employees(id);
        END IF;

        -- Adicionar foreign key para work_post_id se a tabela work_posts existir
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
        END IF;

        -- Criar trigger para updated_at se a função existir
        IF EXISTS (
            SELECT 1 
            FROM pg_proc 
            WHERE proname = 'update_updated_at_column'
        ) THEN
            CREATE TRIGGER update_schedules_updated_at
                BEFORE UPDATE ON schedules
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;

        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_schedules_location_id ON schedules(location_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_employee_id ON schedules(employee_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_work_post_id ON schedules(work_post_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_schedule_date ON schedules(schedule_date);
        CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

        RAISE NOTICE 'Tabela schedules criada com sucesso';
    ELSE
        -- Se a tabela já existe, apenas garantir que as colunas necessárias existam
        
        -- Adicionar employee_id se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'schedules' 
            AND column_name = 'employee_id'
        ) THEN
            ALTER TABLE schedules ADD COLUMN employee_id UUID;
            IF EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_name = 'employees'
            ) THEN
                ALTER TABLE schedules 
                ADD CONSTRAINT fk_schedules_employee 
                FOREIGN KEY (employee_id) 
                REFERENCES employees(id);
            END IF;
            RAISE NOTICE 'Coluna employee_id adicionada à tabela schedules';
        END IF;

        -- Adicionar work_post_id se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'schedules' 
            AND column_name = 'work_post_id'
        ) THEN
            ALTER TABLE schedules ADD COLUMN work_post_id UUID;
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
            END IF;
            RAISE NOTICE 'Coluna work_post_id adicionada à tabela schedules';
        END IF;

        -- Adicionar observations se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'schedules' 
            AND column_name = 'observations'
        ) THEN
            ALTER TABLE schedules ADD COLUMN observations TEXT;
            RAISE NOTICE 'Coluna observations adicionada à tabela schedules';
        END IF;

        -- Criar índices se não existirem
        CREATE INDEX IF NOT EXISTS idx_schedules_employee_id ON schedules(employee_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_work_post_id ON schedules(work_post_id);
        
        RAISE NOTICE 'Tabela schedules já existe. Colunas verificadas e atualizadas se necessário.';
    END IF;
END $$;



















