-- V209 adicionou driver_id em fines, mas V227 dropou e recriou a tabela sem a coluna.
-- A entidade Fine mapeia @ManyToOne Driver -> driver_id; sem ela, todo SELECT falha.
ALTER TABLE fines ADD COLUMN IF NOT EXISTS driver_id UUID;

ALTER TABLE fines DROP CONSTRAINT IF EXISTS fk_fines_driver;
ALTER TABLE fines ADD CONSTRAINT fk_fines_driver
    FOREIGN KEY (driver_id) REFERENCES drivers(id);

CREATE INDEX IF NOT EXISTS idx_fines_driver_id ON fines(driver_id);
