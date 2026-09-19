-- Migration V4602: Altera a coluna photo_url para TEXT em fleet_work_order_photos para suportar Base64 e URLs longas
ALTER TABLE fleet_work_order_photos ALTER COLUMN photo_url TYPE TEXT;
