-- Migration V200: Create email_queue table for EmailDispatchWorker
-- This table stores emails to be sent by the email dispatch worker

CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    priority INTEGER NOT NULL DEFAULT 5,
    scheduled_at TIMESTAMP NOT NULL DEFAULT NOW(),
    recipient_to VARCHAR(255) NOT NULL,
    recipient_cc VARCHAR(500),
    recipient_bcc VARCHAR(500),
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    template_code VARCHAR(100),
    config_id UUID,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient query by status
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);

-- Index for scheduled_at ordering
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);

-- Composite index for the worker query pattern
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_at, priority DESC);
