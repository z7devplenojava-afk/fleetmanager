-- Garantir que a tabela work_posts existe e tem PRIMARY KEY correta
-- Esta migration é idempotente e pode ser executada múltiplas vezes

DO $$
BEGIN
    -- Verificar se a tabela work_posts existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_posts') THEN
        RAISE NOTICE 'Tabela work_posts não existe. Criando...';
        
        -- Criar enums se não existirem
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_post_type') THEN
            CREATE TYPE work_post_type AS ENUM (
                'POSTO_24H',
                'POSTO_12H_DIURNO',
                'POSTO_12H_NOTURNO',
                'POSTO_8H_DIURNO',
                'POSTO_8H_NOTURNO',
                'POSTO_SDF',
                'POSTO_ESPECIAL'
            );
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_post_status') THEN
            CREATE TYPE work_post_status AS ENUM (
                'EM_IMPLANTACAO',
                'ATIVO',
                'INATIVO',
                'SUSPENSO',
                'CANCELADO',
                'EM_ANALISE',
                'PENDENTE'
            );
        END IF;
        
        -- Criar tabela work_posts com PRIMARY KEY
        CREATE TABLE work_posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            post_code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            type work_post_type NOT NULL,
            status work_post_status NOT NULL DEFAULT 'EM_IMPLANTACAO',
            
            -- Location
            address VARCHAR(500) NOT NULL,
            city VARCHAR(100),
            state VARCHAR(2),
            zip_code VARCHAR(10),
            
            -- Relationships (tornados opcionais temporariamente para evitar erros)
            client_id UUID,
            contract_id UUID,
            responsible_id UUID,
            
            -- Personnel Configuration
            required_vigilantes INTEGER NOT NULL DEFAULT 1,
            work_schedule VARCHAR(50) NOT NULL DEFAULT '12x36',
            shift_start TIME NOT NULL DEFAULT '08:00:00',
            shift_end TIME NOT NULL DEFAULT '20:00:00',
            shift_description VARCHAR(100),
            
            -- Benefits and Conditions
            transport_voucher BOOLEAN DEFAULT FALSE,
            cost_allowance BOOLEAN DEFAULT FALSE,
            cost_allowance_value DECIMAL(10,2),
            intrajourney BOOLEAN DEFAULT FALSE,
            local_meal BOOLEAN DEFAULT FALSE,
            meal_ticket BOOLEAN DEFAULT FALSE,
            health_plan BOOLEAN DEFAULT FALSE,
            dental_plan BOOLEAN DEFAULT FALSE,
            
            -- Resources and Equipment
            cars INTEGER DEFAULT 0,
            motorcycles INTEGER DEFAULT 0,
            radios INTEGER DEFAULT 0,
            corporates INTEGER DEFAULT 0,
            document_bank BOOLEAN DEFAULT FALSE,
            
            -- Legal Compliance
            pgr BOOLEAN DEFAULT FALSE,
            pcmso BOOLEAN DEFAULT FALSE,
            
            -- Implementation
            implementation_date DATE,
            implementation_time TIME,
            observations TEXT,
            
            -- Audit
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_work_posts_client_id ON work_posts(client_id);
        CREATE INDEX idx_work_posts_contract_id ON work_posts(contract_id);
        CREATE INDEX idx_work_posts_responsible_id ON work_posts(responsible_id);
        CREATE INDEX idx_work_posts_status ON work_posts(status);
        CREATE INDEX idx_work_posts_type ON work_posts(type);
        CREATE INDEX idx_work_posts_post_code ON work_posts(post_code);
        CREATE INDEX idx_work_posts_city ON work_posts(city);
        CREATE INDEX idx_work_posts_state ON work_posts(state);
        
        -- Criar trigger para updated_at
        CREATE OR REPLACE FUNCTION update_work_posts_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_update_work_posts_updated_at
            BEFORE UPDATE ON work_posts
            FOR EACH ROW
            EXECUTE FUNCTION update_work_posts_updated_at();
        
        RAISE NOTICE 'Tabela work_posts criada com sucesso';
    ELSE
        -- Verificar se tem PRIMARY KEY
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'work_posts'::regclass 
            AND contype = 'p'
        ) THEN
            RAISE NOTICE 'Adicionando PRIMARY KEY à tabela work_posts existente';
            ALTER TABLE work_posts ADD PRIMARY KEY (id);
        ELSE
            RAISE NOTICE 'Tabela work_posts já existe com PRIMARY KEY';
        END IF;
    END IF;
END $$;
