-- V434: Criar tabela route_points para pontos de rota (embarque, desembarque, início, fim)
CREATE TABLE IF NOT EXISTS route_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL,
    name VARCHAR(500) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    point_order INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    radius_meters INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_route_points_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- Índice para busca por rota
CREATE INDEX IF NOT EXISTS idx_route_points_route_id ON route_points(route_id);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_route_points_order ON route_points(route_id, point_order);
