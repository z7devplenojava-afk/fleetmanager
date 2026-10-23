-- V4669: Adicionar colunas de pegadas (1ª a 4ª) e hora noturna reduzida (CLT) em driver_work_hours
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS pegada1_start TIMESTAMP;
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS pegada1_end TIMESTAMP;
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS pegada2_start TIMESTAMP;
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS pegada2_end TIMESTAMP;
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS pegada3_start TIMESTAMP;
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS pegada3_end TIMESTAMP;
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS pegada4_start TIMESTAMP;
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS pegada4_end TIMESTAMP;
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS night_reduced_minutes INTEGER DEFAULT 0;
ALTER TABLE driver_work_hours ADD COLUMN IF NOT EXISTS contract_daily_minutes INTEGER DEFAULT 480;
