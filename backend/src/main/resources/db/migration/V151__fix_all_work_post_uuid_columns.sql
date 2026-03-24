-- Migration: V270__fix_all_work_post_uuid_columns.sql
-- Corrigir TODAS as colunas work_post_id que ainda estão como BIGINT

-- 1. work_post_nrs
ALTER TABLE work_post_nrs DROP CONSTRAINT IF EXISTS fk_work_post_nrs_work_post;
ALTER TABLE work_post_nrs ALTER COLUMN work_post_id TYPE UUID USING 
    CASE WHEN work_post_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;

-- 2. work_post_epis (se ainda não foi corrigida)
ALTER TABLE work_post_epis DROP CONSTRAINT IF EXISTS fk_work_post_epis_work_post;
ALTER TABLE work_post_epis ALTER COLUMN work_post_id TYPE UUID USING 
    CASE WHEN work_post_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;

-- 3. work_post_equipment (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_post_equipment') THEN
        ALTER TABLE work_post_equipment DROP CONSTRAINT IF EXISTS fk_work_post_equipment_work_post;
        ALTER TABLE work_post_equipment ALTER COLUMN work_post_id TYPE UUID USING 
            CASE WHEN work_post_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;
    END IF;
END $$;

-- 4. work_post_vehicles (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_post_vehicles') THEN
        ALTER TABLE work_post_vehicles DROP CONSTRAINT IF EXISTS fk_work_post_vehicles_work_post;
        ALTER TABLE work_post_vehicles ALTER COLUMN work_post_id TYPE UUID USING 
            CASE WHEN work_post_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;
    END IF;
END $$;

-- 5. work_post_employees (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_post_employees') THEN
        ALTER TABLE work_post_employees DROP CONSTRAINT IF EXISTS fk_work_post_employees_work_post;
        ALTER TABLE work_post_employees ALTER COLUMN work_post_id TYPE UUID USING 
            CASE WHEN work_post_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;
    END IF;
END $$;

-- 6. work_post_trainings (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_post_trainings') THEN
        ALTER TABLE work_post_trainings DROP CONSTRAINT IF EXISTS fk_work_post_trainings_work_post;
        ALTER TABLE work_post_trainings ALTER COLUMN work_post_id TYPE UUID USING 
            CASE WHEN work_post_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;
    END IF;
END $$;

-- Recriar as foreign keys (apenas para as tabelas que existem)
ALTER TABLE work_post_nrs ADD CONSTRAINT fk_work_post_nrs_work_post 
    FOREIGN KEY (work_post_id) REFERENCES work_posts(id);
ALTER TABLE work_post_epis ADD CONSTRAINT fk_work_post_epis_work_post 
    FOREIGN KEY (work_post_id) REFERENCES work_posts(id); 