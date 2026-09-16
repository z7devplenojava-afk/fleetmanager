-- MÓDULO 7: Boletim de Medição, Faturamento & Controladoria Financeira
-- RF-07.4: Emissão e controle de Boleto Bancário registrado
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS boleto_url VARCHAR(500);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS boleto_bar_code VARCHAR(100);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS boleto_digitable_line VARCHAR(60);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS boleto_generation_date TIMESTAMP;

-- RF-07.1: Cobertura por carro reserva durante parada de manutenção
-- (define se os dias parados geram corte de diária no Boletim de Medição)
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS reserve_vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS reserve_covered BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS reserve_response_minutes INTEGER;

-- Índices para o DRE por placa e cortes do período
CREATE INDEX IF NOT EXISTS idx_fwo_vehicle_actual_date ON fleet_work_orders (vehicle_id, actual_date);
CREATE INDEX IF NOT EXISTS idx_ar_measurement ON accounts_receivable (measurement_id);
