-- E-mail profissional: domínio obrigatório por empresa, segurança e cota de caixa.

-- 1. Domínio de e-mail da empresa (validado no cadastro de contas IMAP/SMTP).
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_domain VARCHAR(120);

-- 2. Preservação da organização de pastas do webmail de origem (cPanel).
ALTER TABLE email_folders ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE email_folders ADD COLUMN IF NOT EXISTS full_path VARCHAR(500);

-- 3. Segurança e rastreabilidade por mensagem.
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS spf_status VARCHAR(20);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS dkim_status VARCHAR(20);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS dmarc_status VARCHAR(20);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS spam_score NUMERIC(6,2);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS security_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_email_messages_security_status
    ON email_messages(security_status);
CREATE INDEX IF NOT EXISTS idx_email_messages_company_date
    ON email_messages(company_id, date DESC);

-- 4. Cota de armazenamento por conta/empresa.
CREATE TABLE IF NOT EXISTS email_mailbox_quotas (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    account_id UUID NOT NULL,
    max_bytes BIGINT NOT NULL DEFAULT 1073741824, -- 1 GB
    used_bytes BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP,
    CONSTRAINT fk_email_quota_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_email_quota_account FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE,
    CONSTRAINT uk_email_quota_account UNIQUE (account_id)
);

-- 5. Quarentena/auditoria de mensagens perigosas e cliques em links.
CREATE TABLE IF NOT EXISTS email_security_events (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    account_id UUID,
    message_id UUID,
    event_type VARCHAR(40) NOT NULL, -- DANGEROUS_MESSAGE, LINK_BLOCKED, LINK_CLICKED, ATTACHMENT_BLOCKED
    detail TEXT,
    actor_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_security_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_email_security_events_company_created
    ON email_security_events(company_id, created_at DESC);
