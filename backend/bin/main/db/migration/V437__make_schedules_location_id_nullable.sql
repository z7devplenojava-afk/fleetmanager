-- V437: Garantir que location_id na tabela schedules é nullable
-- Necessário para escalas que usam travel_trip_id ao invés de location_id/work_post_id

DO $$
BEGIN
    -- Verificar se a coluna location_id tem restrição NOT NULL e removê-la
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND column_name = 'location_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE schedules ALTER COLUMN location_id DROP NOT NULL;
        RAISE NOTICE 'location_id agora é nullable na tabela schedules';
    ELSE
        RAISE NOTICE 'location_id já é nullable na tabela schedules';
    END IF;
END $$;
