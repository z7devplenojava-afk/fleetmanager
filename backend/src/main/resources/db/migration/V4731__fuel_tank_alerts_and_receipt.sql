-- Migration V4731: Suporte a alertas de nível de tanque de combustível e histórico de envio WhatsApp

-- 1. Adicionar coluna de controle de patamar de alerta no tanque
ALTER TABLE fuel_tanks ADD COLUMN IF NOT EXISTS last_alert_threshold NUMERIC(12, 2);

-- 2. Tabela de histórico de alertas de tanque enviados
CREATE TABLE IF NOT EXISTS fuel_tank_alert_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    fuel_tank_id UUID NOT NULL REFERENCES fuel_tanks(id) ON DELETE CASCADE,
    threshold_level NUMERIC(12, 2) NOT NULL,
    current_level NUMERIC(12, 2) NOT NULL,
    alert_date TIMESTAMP NOT NULL DEFAULT NOW(),
    recipients TEXT,
    whatsapp_status VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_tank_alert_logs_company ON fuel_tank_alert_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_fuel_tank_alert_logs_tank ON fuel_tank_alert_logs(fuel_tank_id);
CREATE INDEX IF NOT EXISTS idx_fuel_tank_alert_logs_date ON fuel_tank_alert_logs(alert_date DESC);
