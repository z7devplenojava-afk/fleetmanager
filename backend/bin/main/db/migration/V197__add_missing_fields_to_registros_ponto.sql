-- Add missing fields to time_records table (CORRIGIDO)
DO $$
BEGIN
    -- Check if time_records table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_records') THEN
        -- Add missing columns if they do not exist
        BEGIN
            ALTER TABLE time_records ADD COLUMN employee_id UUID;
        EXCEPTION WHEN duplicate_column THEN END;
        
        BEGIN
            ALTER TABLE time_records ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
        EXCEPTION WHEN duplicate_column THEN END;
        
        BEGIN
            ALTER TABLE time_records ADD COLUMN lunch_entry_time TIME;
        EXCEPTION WHEN duplicate_column THEN END;
        
        BEGIN
            ALTER TABLE time_records ADD COLUMN lunch_exit_time TIME;
        EXCEPTION WHEN duplicate_column THEN END;
        
        BEGIN
            ALTER TABLE time_records ADD COLUMN justification VARCHAR(255);
        EXCEPTION WHEN duplicate_column THEN END;
        
        BEGIN
            ALTER TABLE time_records ADD CONSTRAINT fk_time_records_employee FOREIGN KEY (employee_id) REFERENCES employees(id);
        EXCEPTION WHEN duplicate_object THEN END;

        -- Drop old columns if they exist
        BEGIN
            ALTER TABLE time_records DROP COLUMN user_id;
        EXCEPTION WHEN undefined_column THEN END;
        
        BEGIN
            ALTER TABLE time_records DROP COLUMN data_hora;
        EXCEPTION WHEN undefined_column THEN END;
        
        BEGIN
            ALTER TABLE time_records DROP COLUMN tipo;
        EXCEPTION WHEN undefined_column THEN END;
        
        BEGIN
            ALTER TABLE time_records DROP COLUMN observacao;
        EXCEPTION WHEN undefined_column THEN END;

        RAISE NOTICE 'Tabela time_records atualizada com sucesso';
    ELSE
        -- If time_records doesn't exist, check if registros_ponto exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'registros_ponto') THEN
            -- Rename registros_ponto to time_records
            ALTER TABLE registros_ponto RENAME TO time_records;

            -- Add new columns
            ALTER TABLE time_records ADD COLUMN employee_id UUID;
            ALTER TABLE time_records ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
            ALTER TABLE time_records ADD COLUMN lunch_entry_time TIME;
            ALTER TABLE time_records ADD COLUMN lunch_exit_time TIME;
            ALTER TABLE time_records ADD COLUMN justification VARCHAR(255);

            -- Try to add foreign key constraint (only if employees table exists)
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
                BEGIN
                    ALTER TABLE time_records ADD CONSTRAINT fk_time_records_employee FOREIGN KEY (employee_id) REFERENCES employees(id);
                EXCEPTION WHEN duplicate_object THEN END;
            END IF;

            -- Update employee_id based on user_id (only if both tables exist)
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
                UPDATE time_records tr
                SET employee_id = e.id
                FROM users u
                JOIN employees e ON e.user_id = u.id
                WHERE tr.user_id = u.id;
            END IF;

            -- Rename columns if they exist
            BEGIN
                ALTER TABLE time_records RENAME COLUMN hora_entrada TO entry_time;
            EXCEPTION WHEN undefined_column THEN END;
            
            BEGIN
                ALTER TABLE time_records RENAME COLUMN hora_saida TO exit_time;
            EXCEPTION WHEN undefined_column THEN END;
            
            BEGIN
                ALTER TABLE time_records RENAME COLUMN hora_entrada_almoco TO lunch_entry_time;
            EXCEPTION WHEN undefined_column THEN END;
            
            BEGIN
                ALTER TABLE time_records RENAME COLUMN hora_saida_almoco TO lunch_exit_time;
            EXCEPTION WHEN undefined_column THEN END;
            
            BEGIN
                ALTER TABLE time_records RENAME COLUMN observacao TO justification;
            EXCEPTION WHEN undefined_column THEN END;

            -- Convert time columns to proper TIME type if they exist
            BEGIN
                ALTER TABLE time_records ALTER COLUMN entry_time TYPE TIME USING entry_time::TIME;
            EXCEPTION WHEN undefined_column THEN END;
            
            BEGIN
                ALTER TABLE time_records ALTER COLUMN exit_time TYPE TIME USING exit_time::TIME;
            EXCEPTION WHEN undefined_column THEN END;
            
            BEGIN
                ALTER TABLE time_records ALTER COLUMN lunch_entry_time TYPE TIME USING lunch_entry_time::TIME;
            EXCEPTION WHEN undefined_column THEN END;
            
            BEGIN
                ALTER TABLE time_records ALTER COLUMN lunch_exit_time TYPE TIME USING lunch_exit_time::TIME;
            EXCEPTION WHEN undefined_column THEN END;

            -- Drop old columns that are no longer needed
            BEGIN
                ALTER TABLE time_records DROP COLUMN user_id;
            EXCEPTION WHEN undefined_column THEN END;
            
            BEGIN
                ALTER TABLE time_records DROP COLUMN data_hora;
            EXCEPTION WHEN undefined_column THEN END;
            
            BEGIN
                ALTER TABLE time_records DROP COLUMN tipo;
            EXCEPTION WHEN undefined_column THEN END;

            RAISE NOTICE 'Tabela registros_ponto renomeada para time_records e atualizada com sucesso';
        ELSE
            -- Neither table exists, create time_records from scratch
            CREATE TABLE time_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID,
                record_date DATE NOT NULL DEFAULT CURRENT_DATE,
                entry_time TIME,
                exit_time TIME,
                lunch_entry_time TIME,
                lunch_exit_time TIME,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                justification VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Try to add foreign key constraint (only if employees table exists)
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
                BEGIN
                    ALTER TABLE time_records ADD CONSTRAINT fk_time_records_employee FOREIGN KEY (employee_id) REFERENCES employees(id);
                EXCEPTION WHEN duplicate_object THEN END;
            END IF;

            RAISE NOTICE 'Tabela time_records criada do zero com sucesso';
        END IF;
    END IF;
END $$; 