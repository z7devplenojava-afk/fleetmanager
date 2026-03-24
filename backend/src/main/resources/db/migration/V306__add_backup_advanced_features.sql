-- =====================================================
-- Migration V306: Adicionar Funcionalidades Avançadas de Backup
-- =====================================================

-- Adicionar colunas para ambientes e tipos de backup
ALTER TABLE backup_configurations
ADD COLUMN environment VARCHAR(20),
ADD COLUMN backup_type VARCHAR(20) NOT NULL DEFAULT 'FULL',
ADD COLUMN encryption_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN encryption_key VARCHAR(500),
ADD COLUMN checksum_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN last_checksum VARCHAR(64);

-- Adicionar constraints
ALTER TABLE backup_configurations
ADD CONSTRAINT chk_environment CHECK (environment IN ('CI', 'DEV', 'TEST', 'PROD')),
ADD CONSTRAINT chk_backup_type CHECK (backup_type IN ('FULL', 'INCREMENTAL', 'DIFFERENTIAL', 'LOGS_ONLY'));

-- Adicionar colunas de checksum no histórico
ALTER TABLE backup_history
ADD COLUMN checksum VARCHAR(64),
ADD COLUMN encrypted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN backup_type VARCHAR(20);

-- Índices adicionais
CREATE INDEX idx_backup_config_environment ON backup_configurations(environment);
CREATE INDEX idx_backup_history_checksum ON backup_history(checksum);

-- Comentários
COMMENT ON COLUMN backup_configurations.environment IS 'Ambiente: CI, DEV, TEST ou PROD';
COMMENT ON COLUMN backup_configurations.backup_type IS 'Tipo: FULL, INCREMENTAL, DIFFERENTIAL ou LOGS_ONLY';
COMMENT ON COLUMN backup_configurations.encryption_enabled IS 'Se TRUE, backup será criptografado com AES-256';
COMMENT ON COLUMN backup_configurations.checksum_enabled IS 'Se TRUE, gera checksum SHA-256 para verificação de integridade';
COMMENT ON COLUMN backup_history.checksum IS 'Hash SHA-256 do arquivo de backup para verificação de integridade';

