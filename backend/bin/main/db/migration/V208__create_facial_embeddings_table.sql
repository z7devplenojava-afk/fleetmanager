-- Migration: V500__create_facial_embeddings_table.sql
-- Description: Create facial embeddings table for supervisor facial recognition

-- Criar tabela de embeddings faciais
CREATE TABLE IF NOT EXISTS facial_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id UUID NOT NULL,
    encrypted_embedding TEXT NOT NULL,
    embedding_hash VARCHAR(64) NOT NULL, -- Hash para verificação de integridade
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    confidence_score DECIMAL(3,2) DEFAULT 0.00, -- Score de confiança do embedding
    liveness_verified BOOLEAN DEFAULT FALSE, -- Se passou na verificação de liveness
    
    -- Constraints
    CONSTRAINT fk_facial_embeddings_supervisor 
        FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT chk_confidence_score CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_facial_embeddings_supervisor ON facial_embeddings(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_facial_embeddings_active ON facial_embeddings(is_active);
CREATE INDEX IF NOT EXISTS idx_facial_embeddings_hash ON facial_embeddings(embedding_hash);
CREATE INDEX IF NOT EXISTS idx_facial_embeddings_last_used ON facial_embeddings(last_used);

-- Criar tabela de tentativas de login facial
CREATE TABLE IF NOT EXISTS facial_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id UUID,
    attempt_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    confidence_score DECIMAL(3,2),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    ip_address INET,
    user_agent TEXT,
    failure_reason VARCHAR(100),
    
    -- Constraints
    CONSTRAINT fk_facial_login_attempts_supervisor 
        FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Criar índices para auditoria
CREATE INDEX IF NOT EXISTS idx_facial_login_attempts_supervisor ON facial_login_attempts(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_facial_login_attempts_time ON facial_login_attempts(attempt_time);
CREATE INDEX IF NOT EXISTS idx_facial_login_attempts_success ON facial_login_attempts(success);

-- Comentários para documentação
COMMENT ON TABLE facial_embeddings IS 'Tabela para armazenar embeddings faciais criptografados dos supervisores';
COMMENT ON TABLE facial_login_attempts IS 'Tabela para auditoria de tentativas de login facial';
COMMENT ON COLUMN facial_embeddings.encrypted_embedding IS 'Embedding facial criptografado com AES-256';
COMMENT ON COLUMN facial_embeddings.embedding_hash IS 'Hash SHA-256 do embedding para verificação de integridade';
COMMENT ON COLUMN facial_embeddings.confidence_score IS 'Score de confiança do embedding (0.00 a 1.00)';
COMMENT ON COLUMN facial_embeddings.liveness_verified IS 'Indica se o embedding passou na verificação de liveness';
