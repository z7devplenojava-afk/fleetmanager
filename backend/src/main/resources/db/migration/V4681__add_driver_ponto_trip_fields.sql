-- V4681: Adiciona campos operacionais de Cliente, Código de Percurso e Quantidade de Passageiros ao Ponto Eletrônico do Motorista
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS client_name VARCHAR(200);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS route_code VARCHAR(120);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS passengers_count INTEGER;

