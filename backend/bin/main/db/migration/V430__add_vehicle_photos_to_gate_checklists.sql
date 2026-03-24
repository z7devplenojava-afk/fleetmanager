ALTER TABLE vehicle_gate_checklists
  ADD COLUMN vehicle_photos TEXT;

COMMENT ON COLUMN vehicle_gate_checklists.vehicle_photos IS 'URLs das fotos do veículo capturadas no checklist (separadas por vírgula)';
