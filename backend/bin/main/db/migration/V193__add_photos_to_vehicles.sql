-- Migration: V411__add_photos_to_vehicles.sql
-- Description: Adiciona campo photos na tabela vehicles para armazenar URLs das fotos

-- Adicionar coluna photos
ALTER TABLE vehicles
ADD COLUMN photos TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN vehicles.photos IS 'URLs das fotos do veículo (separadas por vírgula)';

-- Adicionar índice para melhorar performance de consultas (opcional)
-- CREATE INDEX idx_vehicles_photos ON vehicles USING gin(to_tsvector('portuguese', photos));
