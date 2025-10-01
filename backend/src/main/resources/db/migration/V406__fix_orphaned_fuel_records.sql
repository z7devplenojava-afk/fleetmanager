-- Corrigir registros de combustível que referenciam veículos inexistentes
-- Esta migração remove registros órfãos ou define vehicle_id como NULL

-- 1. Identificar registros órfãos
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM fuel_records fr
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    WHERE v.id IS NULL;
    
    RAISE NOTICE 'Encontrados % registros de combustível órfãos', orphaned_count;
END $$;

-- 2. Remover registros de combustível que referenciam veículos inexistentes
DELETE FROM fuel_records 
WHERE vehicle_id NOT IN (SELECT id FROM vehicles);

-- 3. Verificar se ainda existem registros órfãos
DO $$
DECLARE
    remaining_orphaned INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_orphaned
    FROM fuel_records fr
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    WHERE v.id IS NULL;
    
    IF remaining_orphaned = 0 THEN
        RAISE NOTICE 'Todos os registros órfãos foram removidos com sucesso';
    ELSE
        RAISE NOTICE 'Ainda existem % registros órfãos', remaining_orphaned;
    END IF;
END $$;
