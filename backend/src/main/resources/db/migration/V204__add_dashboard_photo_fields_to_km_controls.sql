-- Migração para adicionar campos de foto do painel à tabela km_controls
-- V423__add_dashboard_photo_fields_to_km_controls.sql

-- Adicionar campos para foto do painel
ALTER TABLE km_controls 
ADD COLUMN IF NOT EXISTS dashboard_photo_url VARCHAR(500);

ALTER TABLE km_controls 
ADD COLUMN IF NOT EXISTS dashboard_photo_description TEXT;

-- Comentários para documentar as novas colunas
COMMENT ON COLUMN km_controls.dashboard_photo_url IS 'URL da foto do painel do veículo';
COMMENT ON COLUMN km_controls.dashboard_photo_description IS 'Descrição ou observação sobre a foto do painel';
