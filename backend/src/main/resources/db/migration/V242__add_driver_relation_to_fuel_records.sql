ALTER TABLE fuel_records ADD COLUMN driver_id UUID;
ALTER TABLE fuel_records ADD CONSTRAINT fk_fuelrecord_driver FOREIGN KEY (driver_id) REFERENCES drivers(id);
-- Opcional: migrar dados do campo antigo para a nova relação, se necessário 

-- Migration: V242__remove_role_id_from_users.sql
-- Description: Remove a coluna role_id da tabela users

ALTER TABLE users DROP COLUMN IF EXISTS role_id; 