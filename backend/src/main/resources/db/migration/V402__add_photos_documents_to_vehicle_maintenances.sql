-- Adicionar colunas photos e documents à tabela vehicle_maintenances
-- Estas colunas são necessárias para o funcionamento correto da entidade VehicleMaintenance

-- Adicionar coluna photos
ALTER TABLE vehicle_maintenances 
ADD COLUMN IF NOT EXISTS photos TEXT;

-- Adicionar coluna documents  
ALTER TABLE vehicle_maintenances 
ADD COLUMN IF NOT EXISTS documents TEXT;

-- Comentários para documentação
COMMENT ON COLUMN vehicle_maintenances.photos IS 'Lista de URLs das fotos da manutenção (JSON array)';
COMMENT ON COLUMN vehicle_maintenances.documents IS 'Lista de URLs dos documentos da manutenção (JSON array)';
