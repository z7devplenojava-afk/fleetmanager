-- Migration para criar tabela de logs de entrega de holerites

CREATE TABLE IF NOT EXISTS payslip_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    channel VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 1,
    error_message VARCHAR(500),
    file_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_cpf ON payslip_delivery_logs(cpf);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_month_year ON payslip_delivery_logs(month, year);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_channel ON payslip_delivery_logs(channel);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_success ON payslip_delivery_logs(success);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_created_at ON payslip_delivery_logs(created_at DESC);

-- Comentários
COMMENT ON TABLE payslip_delivery_logs IS 'Logs de tentativas de entrega de holerites via email e WhatsApp';
COMMENT ON COLUMN payslip_delivery_logs.cpf IS 'CPF do funcionário que recebeu (ou não) o holerite';
COMMENT ON COLUMN payslip_delivery_logs.month IS 'Mês do holerite';
COMMENT ON COLUMN payslip_delivery_logs.year IS 'Ano do holerite';
COMMENT ON COLUMN payslip_delivery_logs.channel IS 'Canal de envio: EMAIL ou WHATSAPP';
COMMENT ON COLUMN payslip_delivery_logs.success IS 'Se o envio foi bem-sucedido';
COMMENT ON COLUMN payslip_delivery_logs.attempts IS 'Número de tentativas de envio';
COMMENT ON COLUMN payslip_delivery_logs.error_message IS 'Mensagem de erro caso tenha falhado';
COMMENT ON COLUMN payslip_delivery_logs.file_path IS 'Caminho do arquivo enviado';

