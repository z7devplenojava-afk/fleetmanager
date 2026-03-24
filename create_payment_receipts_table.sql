-- Script para criar a tabela de comprovantes de pagamento de funcionários
-- Separada das funcionalidades de Holerites

CREATE TABLE IF NOT EXISTS payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name VARCHAR(255) NOT NULL,
    year VARCHAR(4) NOT NULL,
    month VARCHAR(20) NOT NULL,
    month_number VARCHAR(2) NOT NULL,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(500) NOT NULL UNIQUE,
    upload_date DATE NOT NULL,
    processed_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSED',
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_payment_receipts_year ON payment_receipts(year);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_month ON payment_receipts(month);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_year_month ON payment_receipts(year, month);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_employee_name ON payment_receipts(employee_name);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_status ON payment_receipts(status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_upload_date ON payment_receipts(upload_date);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_processed_date ON payment_receipts(processed_date);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_created_at ON payment_receipts(created_at);

-- Comentários na tabela
COMMENT ON TABLE payment_receipts IS 'Tabela para armazenar comprovantes de pagamento de funcionários';
COMMENT ON COLUMN payment_receipts.id IS 'Identificador único do comprovante';
COMMENT ON COLUMN payment_receipts.employee_name IS 'Nome do funcionário';
COMMENT ON COLUMN payment_receipts.year IS 'Ano de referência do comprovante';
COMMENT ON COLUMN payment_receipts.month IS 'Mês de referência do comprovante';
COMMENT ON COLUMN payment_receipts.month_number IS 'Número do mês (01-12)';
COMMENT ON COLUMN payment_receipts.file_name IS 'Nome do arquivo PDF';
COMMENT ON COLUMN payment_receipts.file_path IS 'Caminho completo do arquivo';
COMMENT ON COLUMN payment_receipts.upload_date IS 'Data de upload do arquivo';
COMMENT ON COLUMN payment_receipts.processed_date IS 'Data de processamento do arquivo';
COMMENT ON COLUMN payment_receipts.status IS 'Status do processamento (UPLOADED, PROCESSING, PROCESSED, ERROR)';
COMMENT ON COLUMN payment_receipts.amount IS 'Valor do pagamento';
COMMENT ON COLUMN payment_receipts.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN payment_receipts.updated_at IS 'Data da última atualização do registro';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_payment_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_receipts_updated_at
    BEFORE UPDATE ON payment_receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_receipts_updated_at();

-- Inserir dados de exemplo (opcional)
INSERT INTO payment_receipts (
    employee_name, year, month, month_number, file_name, file_path,
    upload_date, processed_date, status, amount
) VALUES 
(
    'JOÃO SILVA SANTOS', '2025', 'janeiro', '01', 
    'comprovante_joao_silva_santos_2025_01.pdf',
    'uploads/payment-receipts/2025/01/comprovante_joao_silva_santos_2025_01.pdf',
    '2025-01-15', '2025-01-15', 'PROCESSED', 3500.00
),
(
    'MARIA OLIVEIRA COSTA', '2025', 'janeiro', '01',
    'comprovante_maria_oliveira_costa_2025_01.pdf',
    'uploads/payment-receipts/2025/01/comprovante_maria_oliveira_costa_2025_01.pdf',
    '2025-01-15', '2025-01-15', 'PROCESSED', 4200.00
),
(
    'CARLOS PEREIRA LIMA', '2025', 'fevereiro', '02',
    'comprovante_carlos_pereira_lima_2025_02.pdf',
    'uploads/payment-receipts/2025/02/comprovante_carlos_pereira_lima_2025_02.pdf',
    '2025-02-15', '2025-02-15', 'PROCESSED', 3800.00
),
(
    'ANA SANTOS RODRIGUES', '2025', 'fevereiro', '02',
    'comprovante_ana_santos_rodrigues_2025_02.pdf',
    'uploads/payment-receipts/2025/02/comprovante_ana_santos_rodrigues_2025_02.pdf',
    '2025-02-15', '2025-02-15', 'PROCESSED', 4100.00
),
(
    'PEDRO ALMEIDA FERREIRA', '2025', 'março', '03',
    'comprovante_pedro_almeida_ferreira_2025_03.pdf',
    'uploads/payment-receipts/2025/03/comprovante_pedro_almeida_ferreira_2025_03.pdf',
    '2025-03-15', '2025-03-15', 'PROCESSED', 4500.00
);

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_receipts' 
ORDER BY ordinal_position;
