-- Migration para criar tabela de configurações de notificações
-- V267: Create notification_settings table

CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    user_id UUID, -- NULL para configurações da empresa, NOT NULL para usuário específico
    
    -- Configurações de Email
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    email_contract_updates BOOLEAN NOT NULL DEFAULT true,
    email_payment_received BOOLEAN NOT NULL DEFAULT true,
    email_schedule_changes BOOLEAN NOT NULL DEFAULT true,
    email_daily_summary BOOLEAN NOT NULL DEFAULT false,
    email_weekly_report BOOLEAN NOT NULL DEFAULT false,
    email_system_alerts BOOLEAN NOT NULL DEFAULT true,
    
    -- Configurações de SMTP
    smtp_enabled BOOLEAN NOT NULL DEFAULT false,
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_username VARCHAR(255),
    smtp_password VARCHAR(255), -- Deve ser criptografado
    smtp_from_email VARCHAR(255),
    smtp_from_name VARCHAR(255),
    smtp_use_tls BOOLEAN NOT NULL DEFAULT true,
    smtp_use_ssl BOOLEAN NOT NULL DEFAULT false,
    
    -- Configurações de Notificações Push
    push_enabled BOOLEAN NOT NULL DEFAULT false,
    push_contract_updates BOOLEAN NOT NULL DEFAULT true,
    push_payment_received BOOLEAN NOT NULL DEFAULT true,
    push_schedule_changes BOOLEAN NOT NULL DEFAULT true,
    push_system_alerts BOOLEAN NOT NULL DEFAULT true,
    
    -- Configurações de SMS
    sms_enabled BOOLEAN NOT NULL DEFAULT false,
    sms_urgent_only BOOLEAN NOT NULL DEFAULT true,
    sms_provider VARCHAR(50),
    sms_api_key VARCHAR(255), -- Deve ser criptografado
    
    -- Configurações de WhatsApp
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
    whatsapp_contract_updates BOOLEAN NOT NULL DEFAULT true,
    whatsapp_payment_received BOOLEAN NOT NULL DEFAULT true,
    whatsapp_schedule_changes BOOLEAN NOT NULL DEFAULT true,
    
    -- Configurações de horários
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
    quiet_hours_start VARCHAR(5), -- HH:mm
    quiet_hours_end VARCHAR(5), -- HH:mm
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notification_settings_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_notification_settings_company_user UNIQUE (company_id, user_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_company_id ON notification_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_company_user ON notification_settings(company_id, user_id);

-- Comentários para documentação
COMMENT ON TABLE notification_settings IS 'Configurações de notificações por empresa e usuário';
COMMENT ON COLUMN notification_settings.user_id IS 'NULL = configurações da empresa, NOT NULL = configurações do usuário';
COMMENT ON COLUMN notification_settings.smtp_password IS 'Senha SMTP criptografada';
COMMENT ON COLUMN notification_settings.sms_api_key IS 'API Key SMS criptografada';
COMMENT ON COLUMN notification_settings.quiet_hours_start IS 'Horário início silencioso (HH:mm)';
COMMENT ON COLUMN notification_settings.quiet_hours_end IS 'Horário fim silencioso (HH:mm)';
