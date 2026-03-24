-- Adição de campos de posicionamento no histórico de movimentos de pneus
ALTER TABLE tire_movements ADD COLUMN axle_number INT;
ALTER TABLE tire_movements ADD COLUMN position_index INT;
