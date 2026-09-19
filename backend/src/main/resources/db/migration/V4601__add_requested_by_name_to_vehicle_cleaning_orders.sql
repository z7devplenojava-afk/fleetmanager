-- Migration V4601: Adiciona coluna requested_by_name na tabela vehicle_cleaning_orders
ALTER TABLE vehicle_cleaning_orders
ADD COLUMN IF NOT EXISTS requested_by_name VARCHAR(120);
