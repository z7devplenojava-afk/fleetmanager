-- ============================================================================
-- Integracao WhatsApp (AstraCalls / Evolution) por empresa + outbox transacional
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL DEFAULT 'ASTRACALLS',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    session_id VARCHAR(120),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_company_whatsapp_configs_company
    ON company_whatsapp_configs(company_id);

CREATE TABLE IF NOT EXISTS whatsapp_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES fleet_work_orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    kind VARCHAR(20) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(200),
    message_text TEXT,
    document_filename VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_attempt_at TIMESTAMP WITHOUT TIME ZONE,
    sent_at TIMESTAMP WITHOUT TIME ZONE,
    provider_message_id VARCHAR(255),
    last_error TEXT,
    dedupe_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_whatsapp_outbox_dedupe UNIQUE (dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_due
    ON whatsapp_outbox(status, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_work_order
    ON whatsapp_outbox(work_order_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_company
    ON whatsapp_outbox(company_id);
