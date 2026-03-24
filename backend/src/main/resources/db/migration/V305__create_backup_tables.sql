-- =====================================================
-- Migration V305: Criar Tabelas de Backup
-- =====================================================

-- Tabela de configurações de backup
CREATE TABLE backup_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('LOCAL', 'REMOTE')),
    
    -- Dados de conexão
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    database VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Senha criptografada
    
    -- Configurações de backup
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_backup BOOLEAN NOT NULL DEFAULT TRUE,
    schedule VARCHAR(100) NOT NULL DEFAULT '0 0 2 * * ?', -- Cron expression
    retention_days INTEGER NOT NULL DEFAULT 30,
    backup_path VARCHAR(500),
    compress_backup BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Status do último backup
    last_backup_date TIMESTAMP,
    last_backup_status VARCHAR(20),
    last_backup_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_backup_config_name ON backup_configurations(name);
CREATE INDEX idx_backup_config_type ON backup_configurations(type);
CREATE INDEX idx_backup_config_enabled ON backup_configurations(enabled);

-- Tabela de histórico de backups
CREATE TABLE backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID NOT NULL,
    backup_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL', 'RUNNING')),
    message TEXT,
    backup_file_path VARCHAR(500),
    backup_size_bytes BIGINT,
    duration_seconds INTEGER,
    tables_backed_up INTEGER,
    rows_backed_up BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_backup_history_config 
        FOREIGN KEY (configuration_id) 
        REFERENCES backup_configurations(id) 
        ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_backup_history_config ON backup_history(configuration_id);
CREATE INDEX idx_backup_history_date ON backup_history(backup_date DESC);
CREATE INDEX idx_backup_history_status ON backup_history(status);

-- Comentários
COMMENT ON TABLE backup_configurations IS 'Configurações de backup do banco de dados (local e VPS)';
COMMENT ON TABLE backup_history IS 'Histórico de execuções de backup';

COMMENT ON COLUMN backup_configurations.type IS 'LOCAL = backup no servidor local | REMOTE = backup na VPS';
COMMENT ON COLUMN backup_configurations.schedule IS 'Expressão cron para agendamento (ex: 0 0 2 * * ? = todo dia 2h)';
COMMENT ON COLUMN backup_configurations.retention_days IS 'Número de dias para manter backups antigos';

