-- =====================================================================
-- V4538: Módulo de Gestão de E-mails (IMAP/SMTP)
-- Contas conectadas, pastas espelhadas, mensagens sincronizadas e anexos.
-- Multi-tenant: company_id em todas as entidades + índice de isolamento.
-- =====================================================================

-- 1. Contas de E-mail (credenciais IMAP/SMTP criptografadas)
CREATE TABLE IF NOT EXISTS email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    user_id UUID,
    email_address VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    imap_host VARCHAR(255) NOT NULL,
    imap_port INTEGER NOT NULL DEFAULT 993,
    imap_ssl BOOLEAN NOT NULL DEFAULT TRUE,
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_ssl BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(255),
    password_encrypted TEXT,
    auth_type VARCHAR(20) DEFAULT 'PASSWORD', -- 'password' | 'oauth2'
    status VARCHAR(20) DEFAULT 'ACTIVE',
    last_sync_at TIMESTAMP WITHOUT TIME ZONE,
    last_sync_status VARCHAR(30),
    last_sync_message TEXT,
    last_sync_total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_email_accounts_company_address UNIQUE (company_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_company ON email_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_user ON email_accounts(user_id);

-- 2. Pastas espelhadas do servidor IMAP
CREATE TABLE IF NOT EXISTS email_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    company_id UUID,
    remote_name VARCHAR(500) NOT NULL,
    display_name VARCHAR(500),
    delimiter VARCHAR(10),
    attributes VARCHAR(200),
    parent_id UUID REFERENCES email_folders(id) ON DELETE CASCADE,
    uid_validity BIGINT,
    highest_uid BIGINT DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_email_folders_account_remote UNIQUE (account_id, remote_name)
);

CREATE INDEX IF NOT EXISTS idx_email_folders_account ON email_folders(account_id);
CREATE INDEX IF NOT EXISTS idx_email_folders_company ON email_folders(company_id);

-- 3. Mensagens sincronizadas
CREATE TABLE IF NOT EXISTS email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES email_folders(id) ON DELETE CASCADE,
    company_id UUID,
    uid BIGINT NOT NULL,
    message_id_header VARCHAR(500),
    in_reply_to VARCHAR(500),
    subject TEXT,
    from_address TEXT,
    to_address TEXT,
    cc_address TEXT,
    sender_address TEXT,
    date TIMESTAMP WITHOUT TIME ZONE,
    body_text TEXT,
    body_html TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    has_attachments BOOLEAN DEFAULT FALSE,
    size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_email_messages_folder_uid UNIQUE (folder_id, uid)
);

CREATE INDEX IF NOT EXISTS idx_email_messages_folder_date ON email_messages(folder_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_account_date ON email_messages(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_account_read ON email_messages(account_id, is_read);
CREATE INDEX IF NOT EXISTS idx_email_messages_company ON email_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_subject_lower ON email_messages ((LOWER(subject)));

-- 4. Anexos das mensagens (armazenados em disco via FileStorageConfig)
CREATE TABLE IF NOT EXISTS email_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    company_id UUID,
    file_name VARCHAR(500) NOT NULL,
    content_type VARCHAR(200),
    size_bytes BIGINT,
    storage_path TEXT,
    content_id VARCHAR(255),
    inline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_msg_attachments_message ON email_message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_email_msg_attachments_account ON email_message_attachments(account_id);
CREATE INDEX IF NOT EXISTS idx_email_msg_attachments_company ON email_message_attachments(company_id);
