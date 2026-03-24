-- Adicionar campos unit_id e centro_custo à tabela accounts_receivable
DO $$
BEGIN
    -- Adicionar coluna unit_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts_receivable' AND column_name = 'unit_id'
    ) THEN
        ALTER TABLE accounts_receivable ADD COLUMN unit_id UUID;
    END IF;
    
    -- Adicionar coluna centro_custo se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts_receivable' AND column_name = 'centro_custo'
    ) THEN
        ALTER TABLE accounts_receivable ADD COLUMN centro_custo VARCHAR(100);
    END IF;
END $$;

-- Garantir que a tabela units tem PRIMARY KEY antes de criar foreign key
DO $$
BEGIN
    -- Verificar se a tabela units existe e se tem PRIMARY KEY
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'units'
    ) THEN
        -- Verificar se há PRIMARY KEY
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'units' 
            AND constraint_type = 'PRIMARY KEY'
        ) THEN
            -- Tentar adicionar PRIMARY KEY se não existir
            BEGIN
                ALTER TABLE units ADD PRIMARY KEY (id);
                RAISE NOTICE 'PRIMARY KEY adicionada à tabela units';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Não foi possível adicionar PRIMARY KEY à tabela units: %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- Adicionar foreign key para unit_id apenas se possível
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'accounts_receivable' 
        AND constraint_name = 'fk_accounts_receivable_unit'
    ) THEN
        -- Verificar se units tem PRIMARY KEY antes de tentar criar foreign key
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'units' 
            AND constraint_type = 'PRIMARY KEY'
        ) THEN
            -- Tentar criar a foreign key
            BEGIN
                ALTER TABLE accounts_receivable
                ADD CONSTRAINT fk_accounts_receivable_unit 
                FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
            EXCEPTION 
                WHEN undefined_table THEN
                    RAISE NOTICE 'Tabela units não existe. Foreign key não criada.';
                WHEN undefined_object THEN
                    RAISE NOTICE 'Coluna id não existe na tabela units. Foreign key não criada.';
                WHEN OTHERS THEN
                    -- Outros erros - logar mas não falhar a migration
                    RAISE NOTICE 'Erro ao criar foreign key fk_accounts_receivable_unit: %. Foreign key não criada.', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Tabela units não tem PRIMARY KEY. Foreign key não criada.';
        END IF;
    END IF;
END $$;

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_unit_id ON accounts_receivable(unit_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_centro_custo ON accounts_receivable(centro_custo);

-- Comentários para documentação
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts_receivable' AND column_name = 'unit_id'
    ) THEN
        COMMENT ON COLUMN accounts_receivable.unit_id IS 'Referência à unidade/empresa';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts_receivable' AND column_name = 'centro_custo'
    ) THEN
        COMMENT ON COLUMN accounts_receivable.centro_custo IS 'Centro de custo da conta a receber';
    END IF;
END $$;

