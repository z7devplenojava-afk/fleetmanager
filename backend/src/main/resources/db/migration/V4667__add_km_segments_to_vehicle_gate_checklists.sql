-- V4667: Adiciona campos de rastreamento de KM de viagem e deslocamento de garagem no checklist de portaria
ALTER TABLE vehicle_gate_checklists
  ADD COLUMN IF NOT EXISTS initial_km INTEGER,
  ADD COLUMN IF NOT EXISTS final_km INTEGER,
  ADD COLUMN IF NOT EXISTS distance_travelled INTEGER,
  ADD COLUMN IF NOT EXISTS has_displacement BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS displacement_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS displacement_initial_km INTEGER,
  ADD COLUMN IF NOT EXISTS displacement_final_km INTEGER,
  ADD COLUMN IF NOT EXISTS displacement_distance INTEGER,
  ADD COLUMN IF NOT EXISTS total_km_travelled INTEGER;

COMMENT ON COLUMN vehicle_gate_checklists.initial_km IS 'KM inicial registrado na saída / início da viagem';
COMMENT ON COLUMN vehicle_gate_checklists.final_km IS 'KM final na entrega do cliente / encerramento da viagem';
COMMENT ON COLUMN vehicle_gate_checklists.distance_travelled IS 'Distância percorrida na viagem do cliente (final_km - initial_km)';
COMMENT ON COLUMN vehicle_gate_checklists.has_displacement IS 'Indica se houve deslocamento vazio / retorno para a garagem';
COMMENT ON COLUMN vehicle_gate_checklists.displacement_type IS 'Tipo de deslocamento (ex: Deslocamento Garagem)';
COMMENT ON COLUMN vehicle_gate_checklists.displacement_initial_km IS 'KM inicial do deslocamento (geralmente igual ao final_km da viagem)';
COMMENT ON COLUMN vehicle_gate_checklists.displacement_final_km IS 'KM final do deslocamento (chegada na garagem)';
COMMENT ON COLUMN vehicle_gate_checklists.displacement_distance IS 'Distância percorrida no deslocamento (displacement_final_km - displacement_initial_km)';
COMMENT ON COLUMN vehicle_gate_checklists.total_km_travelled IS 'Total geral de KM rodado (viagem + deslocamento)';
