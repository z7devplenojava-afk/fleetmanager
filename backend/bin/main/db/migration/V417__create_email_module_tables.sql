-- V417__create_email_module_tables.sql
-- Module: Email Management
-- Description: Creates tables for SMTP configs, templates, async queue and attachments.

-- 1. Configurações de Envio (SMTP)
CREATE TABLE email_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_type VARCHAR(50) NOT NULL, -- 'GLOBAL', 'COMPANY', 'DEPARTMENT'
    context_id UUID, -- NULL se GLOBAL
    
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_username VARCHAR(255),
    smtp_password_encrypted TEXT, -- Senha criptografada
    
    properties JSONB, -- Configs adicionais (tls, auth, timeouts)
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uq_email_config_context UNIQUE (context_type, context_id)
);

-- 2. Templates de E-mail
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE, -- Ex: 'HOLERITE_MENSAL'
    description VARCHAR(255),
    
    subject_template VARCHAR(255) NOT NULL,
    body_html_template TEXT NOT NULL,
    
    required_variables JSONB, -- Array de strings com nomes das variáveis
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 3. Fila de Envio (Queue & Log)
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Controle de Estado
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, SENT, FAILED, RETRY
    priority INTEGER DEFAULT 1,
    
    -- Agendamento
    scheduled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITHOUT TIME ZONE,
    
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    
    -- Contexto
    config_id UUID REFERENCES email_configs(id),
    template_code VARCHAR(100), -- Opcional, referência fraca para não travar histórico se template mudar
    
    -- Conteúdo
    recipient_to TEXT NOT NULL, -- Separados por ;
    recipient_cc TEXT,
    recipient_bcc TEXT,
    
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL, -- Conteúdo processado (final)
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Índices para performance do Worker
CREATE INDEX idx_email_queue_status_scheduled ON email_queue(status, scheduled_at) WHERE status IN ('PENDING', 'RETRY');

-- 4. Anexos
CREATE TABLE email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_queue_id UUID NOT NULL REFERENCES email_queue(id) ON DELETE CASCADE,
    
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    
    storage_type VARCHAR(20) NOT NULL DEFAULT 'LOCAL', -- LOCAL, S3, BLOB
    storage_path TEXT, -- Caminho ou URL
    file_size_bytes BIGINT,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Insert Template Default de Teste
INSERT INTO email_templates (code, description, subject_template, body_html_template, required_variables)
VALUES (
    'TEST_CONNECTION',
    'Email de teste de conexão SMTP',
    'Teste de Conexão - FleetManager',
    '<!DOCTYPE html><html><body><h1>Teste de Conexão</h1><p>Olá {{user_name}},</p><p>Se você está lendo isso, a configuração SMTP está funcionando corretamente.</p><p>Data: {{date}}</p></body></html>',
    '["user_name", "date"]'
);
