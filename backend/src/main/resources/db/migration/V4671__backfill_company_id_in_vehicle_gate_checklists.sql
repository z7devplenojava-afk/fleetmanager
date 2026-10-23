-- V4671: Vincular company_id nos registros de checklist de portaria que ficaram órfãos
UPDATE vehicle_gate_checklists vgc 
SET company_id = v.company_id 
FROM vehicles v 
WHERE vgc.vehicle_id = v.id AND vgc.company_id IS NULL;
