-- Adiciona campos de horário, KM Inicial/Final, registro de ponto com aprovação do tráfego e fotos na tabela schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_time VARCHAR(10);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS initial_km DOUBLE PRECISION;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS final_km DOUBLE PRECISION;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS point_registered_at TIMESTAMP;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS point_status VARCHAR(40) DEFAULT 'NONE';
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS point_justification TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS point_approved_by VARCHAR(150);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS point_approved_at TIMESTAMP;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS trip_photos_json TEXT;

