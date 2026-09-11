-- Migration: Adicionar campos de tipo de veículo e campos específicos de ônibus
-- Data: 2026-08-25

-- Adicionar coluna vehicle_type
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);

-- Adicionar colunas específicas de Ônibus
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS bus_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS passenger_capacity INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS standing_capacity INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS total_doors INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_accessibility BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_air_conditioning BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_wi_fi BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_camera BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_cctv BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS bus_body_type VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis_brand VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body_builder VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_model VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_power_hp INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS axle_count INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS total_weight_kg INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS payload_kg INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_tank_capacity_liters INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS route_number VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS route_name VARCHAR(200);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_bus_type ON vehicles(bus_type);

-- Comentários nas colunas
COMMENT ON COLUMN vehicles.vehicle_type IS 'Tipo do veículo: CAR, TRUCK, MOTORCYCLE, BUS, MINIBUS, VAN, PICKUP, SUV, OTHER';
COMMENT ON COLUMN vehicles.bus_type IS 'Tipo de ônibus: CONVENCIONAL, ARTICULADO, BIARTICULADO, MICROS, PADRON, ELETRICO, HIBRIDO, VIP, ESCOLA, FRETADO, URBANO, INTERMUNICIPAL, RODOVIARIO';
COMMENT ON COLUMN vehicles.passenger_capacity IS 'Capacidade de passageiros sentados';
COMMENT ON COLUMN vehicles.standing_capacity IS 'Capacidade de passageiros em pé';
COMMENT ON COLUMN vehicles.total_doors IS 'Número total de portas';
COMMENT ON COLUMN vehicles.has_accessibility IS 'Possui acessibilidade para cadeirantes';
COMMENT ON COLUMN vehicles.has_air_conditioning IS 'Possui ar condicionado';
COMMENT ON COLUMN vehicles.has_wi_fi IS 'Possui Wi-Fi';
COMMENT ON COLUMN vehicles.has_camera IS 'Possui câmera interna';
COMMENT ON COLUMN vehicles.has_cctv IS 'Possui sistema de CCTV';
COMMENT ON COLUMN vehicles.bus_body_type IS 'Tipo da carroceria do ônibus';
COMMENT ON COLUMN vehicles.chassis_brand IS 'Marca do chassi';
COMMENT ON COLUMN vehicles.body_builder IS 'Fabricante da carroceria';
COMMENT ON COLUMN vehicles.engine_model IS 'Modelo do motor';
COMMENT ON COLUMN vehicles.engine_power_hp IS 'Potência do motor em HP';
COMMENT ON COLUMN vehicles.transmission_type IS 'Tipo de câmbio: MANUAL, AUTOMATICO, AUTOMATIZADO';
COMMENT ON COLUMN vehicles.axle_count IS 'Número de eixos';
COMMENT ON COLUMN vehicles.total_weight_kg IS 'Peso total em kg';
COMMENT ON COLUMN vehicles.payload_kg IS 'Peso útil/carga em kg';
COMMENT ON COLUMN vehicles.fuel_tank_capacity_liters IS 'Capacidade do tanque em litros';
COMMENT ON COLUMN vehicles.route_number IS 'Número da rota/linha';
COMMENT ON COLUMN vehicles.route_name IS 'Nome da rota/linha';
