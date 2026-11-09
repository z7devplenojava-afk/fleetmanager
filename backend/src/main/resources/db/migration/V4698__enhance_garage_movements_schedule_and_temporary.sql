-- =====================================================================
-- V4698: Adiciona campos de escala (work_schedule), permanência temporária
-- (is_temporary) e previsão/registro de saída nas movimentações de garagem
-- =====================================================================

ALTER TABLE garage_movements
    ADD COLUMN IF NOT EXISTS work_schedule VARCHAR(150);

ALTER TABLE garage_movements
    ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT FALSE;

UPDATE garages SET active = TRUE WHERE active IS NULL;

-- Preenche escala padrão nos registros existentes de demonstração se estiverem nulos
UPDATE garage_movements
SET work_schedule = CASE
    WHEN reason = 'ESCALA' THEN '06:00 às 14:20 - Turno Manhã'
    WHEN reason = 'RECOLHIMENTO' THEN '22:00 às 06:00 - Pernoite / Recolhimento'
    WHEN reason = 'MANUTENCAO' THEN 'Parada Técnica - Oficina'
    WHEN reason = 'RESERVA' THEN 'Plantão 24h - Reserva Técnica'
    ELSE '07:00 às 17:00 - Operacional Padrão'
END
WHERE work_schedule IS NULL;
