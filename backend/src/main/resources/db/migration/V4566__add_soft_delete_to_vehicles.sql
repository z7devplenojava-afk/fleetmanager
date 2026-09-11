-- V4566__add_soft_delete_to_vehicles.sql
-- Exclusão suave de veículos: resolve falha de FK ao deletar veículos com
-- histórico (abastecimentos, manutenções, multas, pneus, OSs).
-- Mesmo padrão de V4563 (fleet_work_orders).

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Índice parcial: mantém uniqueness/consultas rápidas apenas para veículos ativos
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles (deleted_at) WHERE deleted_at IS NULL;
