-- Migration V4682: Suporte a Multiempresa/Multicliente para Embarques e Passageiros com QR Code
-- 1. Tabela boardings: flexibilizar trip_id (pode ser embarque avulso por escala) e adicionar metadados operacionais
ALTER TABLE boardings ALTER COLUMN trip_id DROP NOT NULL;
ALTER TABLE boardings ADD COLUMN IF NOT EXISTS schedule_id UUID;
ALTER TABLE boardings ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE boardings ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE boardings ADD COLUMN IF NOT EXISTS direction VARCHAR(20) DEFAULT 'IDA';
ALTER TABLE boardings ADD COLUMN IF NOT EXISTS validation_mode VARCHAR(20) DEFAULT 'ONLINE_QR';
ALTER TABLE boardings ADD COLUMN IF NOT EXISTS is_synced_offline BOOLEAN DEFAULT FALSE;

-- Índices de consulta rápida para o Gestor de Tráfego e RH
CREATE INDEX IF NOT EXISTS idx_boardings_company_id ON boardings(company_id);
CREATE INDEX IF NOT EXISTS idx_boardings_client_id ON boardings(client_id);
CREATE INDEX IF NOT EXISTS idx_boardings_boarding_time ON boardings(boarding_time);
CREATE INDEX IF NOT EXISTS idx_boardings_schedule_id ON boardings(schedule_id);

-- 2. Tabela passengers: suporte a cliente contratante, conta de usuário, status de demissão e rota de retorno
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ATIVO';
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS multiple_routes_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS return_route_id UUID;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS return_boarding_point_id UUID;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS qr_code_token VARCHAR(255);

-- Índices para busca ágil de passageiros e validação instantânea de QR Code
CREATE INDEX IF NOT EXISTS idx_passengers_client_id ON passengers(client_id);
CREATE INDEX IF NOT EXISTS idx_passengers_user_id ON passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_passengers_status ON passengers(status);
CREATE INDEX IF NOT EXISTS idx_passengers_cpf ON passengers(cpf);
CREATE INDEX IF NOT EXISTS idx_passengers_registration ON passengers(registration_number);

