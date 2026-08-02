-- Flag de envio do alerta de multa vencida (independente do alerta de "próxima do vencimento")
ALTER TABLE fines ADD COLUMN IF NOT EXISTS overdue_reminder_sent BOOLEAN DEFAULT FALSE;
