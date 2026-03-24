CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    priority INTEGER DEFAULT 1,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    config_id UUID,
    template_code VARCHAR(100),
    recipient_to TEXT NOT NULL,
    recipient_cc TEXT,
    recipient_bcc TEXT,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_at);
