-- Fase 2 do modulo de ferias: rastreio do abatimento de saldo no PA.
-- Evita abate duplo (aprovar + concluir gozo) e permite estorno ao rejeitar/cancelar.
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS saldo_abatido BOOLEAN NOT NULL DEFAULT FALSE;
