-- =====================================================
-- Migration V4673: Garantir Colunas Avançadas de Backup
-- =====================================================

ALTER TABLE backup_configurations
ADD COLUMN IF NOT EXISTS environment VARCHAR(20),
ADD COLUMN IF NOT EXISTS backup_type VARCHAR(20) NOT NULL DEFAULT 'FULL',
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS encryption_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS checksum_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_checksum VARCHAR(64);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_environment') THEN
        ALTER TABLE backup_configurations ADD CONSTRAINT chk_environment CHECK (environment IN ('CI', 'DEV', 'TEST', 'PROD'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_backup_type') THEN
        ALTER TABLE backup_configurations ADD CONSTRAINT chk_backup_type CHECK (backup_type IN ('FULL', 'INCREMENTAL', 'DIFFERENTIAL', 'LOGS_ONLY'));
    END IF;
END $$;

ALTER TABLE backup_history
ADD COLUMN IF NOT EXISTS checksum VARCHAR(64),
ADD COLUMN IF NOT EXISTS encrypted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS backup_type VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_backup_config_environment ON backup_configurations(environment);
CREATE INDEX IF NOT EXISTS idx_backup_history_checksum ON backup_history(checksum);
