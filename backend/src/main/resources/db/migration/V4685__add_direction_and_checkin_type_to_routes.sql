-- Migration V4685: Adicionar sentido da rota, tipo de check-in e espelhamento de lista
ALTER TABLE routes ADD COLUMN IF NOT EXISTS direction VARCHAR(20) DEFAULT 'IDA';
ALTER TABLE routes ADD COLUMN IF NOT EXISTS checkin_type VARCHAR(30) DEFAULT 'CHECKIN_LIVRE';
ALTER TABLE routes ADD COLUMN IF NOT EXISTS return_same_passengers BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_routes_direction ON routes(direction);
CREATE INDEX IF NOT EXISTS idx_routes_checkin_type ON routes(checkin_type);
