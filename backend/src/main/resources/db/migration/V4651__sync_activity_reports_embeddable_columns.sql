-- Migration V4651: Corrigir e sincronizar colunas de activity_reports (ballistic_plate e weapon_registry)
ALTER TABLE activity_reports
ADD COLUMN IF NOT EXISTS ballistic_plate_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS ballistic_plate_valid_until DATE,
ADD COLUMN IF NOT EXISTS weapon_registry_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS weapon_registry_valid_until DATE,
ADD COLUMN IF NOT EXISTS consultation_date DATE,
ADD COLUMN IF NOT EXISTS reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS doctor VARCHAR(255),
ADD COLUMN IF NOT EXISTS result TEXT;

-- Sincronizar dados caso as colunas antigas existam com valores
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_reports' AND column_name = 'ballistic_plate_ballistic_plate_number') THEN
        UPDATE activity_reports 
        SET ballistic_plate_number = COALESCE(ballistic_plate_number, ballistic_plate_ballistic_plate_number)
        WHERE ballistic_plate_number IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_reports' AND column_name = 'ballistic_plate_ballistic_plate_valid_until') THEN
        UPDATE activity_reports 
        SET ballistic_plate_valid_until = COALESCE(ballistic_plate_valid_until, ballistic_plate_ballistic_plate_valid_until)
        WHERE ballistic_plate_valid_until IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_reports' AND column_name = 'weapon_registry_weapon_registry_number') THEN
        UPDATE activity_reports 
        SET weapon_registry_number = COALESCE(weapon_registry_number, weapon_registry_weapon_registry_number)
        WHERE weapon_registry_number IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_reports' AND column_name = 'weapon_registry_weapon_registry_valid_until') THEN
        UPDATE activity_reports 
        SET weapon_registry_valid_until = COALESCE(weapon_registry_valid_until, weapon_registry_weapon_registry_valid_until)
        WHERE weapon_registry_valid_until IS NULL;
    END IF;
END $$;
