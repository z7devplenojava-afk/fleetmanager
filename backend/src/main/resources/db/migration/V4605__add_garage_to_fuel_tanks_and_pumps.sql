-- Migration V4605: Adiciona garagem aos tanques e bombas de combustível
-- O cadastro de tanque e bomba deve informar em qual garagem o equipamento está instalado.

ALTER TABLE fuel_tanks ADD COLUMN IF NOT EXISTS garage_id UUID REFERENCES garages(id) ON DELETE SET NULL;
ALTER TABLE fuel_pumps ADD COLUMN IF NOT EXISTS garage_id UUID REFERENCES garages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fuel_tanks_garage ON fuel_tanks(garage_id);
CREATE INDEX IF NOT EXISTS idx_fuel_pumps_garage ON fuel_pumps(garage_id);
