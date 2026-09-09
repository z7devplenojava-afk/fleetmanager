-- Migration V4569: Adiciona encerrantes, litros medidos/declarados e alertas de divergência em leituras de bombas

ALTER TABLE fuel_pump_readings ADD COLUMN IF NOT EXISTS declared_liters DECIMAL(12,2);
ALTER TABLE fuel_pump_readings ADD COLUMN IF NOT EXISTS difference_liters DECIMAL(12,2);
ALTER TABLE fuel_pump_readings ADD COLUMN IF NOT EXISTS operator_name VARCHAR(200);
ALTER TABLE fuel_pump_readings ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(20);
ALTER TABLE fuel_pump_readings ADD COLUMN IF NOT EXISTS driver_name VARCHAR(200);
ALTER TABLE fuel_pump_readings ADD COLUMN IF NOT EXISTS has_divergence_alert BOOLEAN DEFAULT FALSE;
