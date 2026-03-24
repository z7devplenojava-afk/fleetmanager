-- Migration V427: Add missing code column and route_points table
-- This is required by Route and RoutePoint entities

DO $$ 
BEGIN 
    -- 1. Add MISSING code column to routes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'code') THEN
        ALTER TABLE routes ADD COLUMN code VARCHAR(255) UNIQUE;
        RAISE NOTICE 'Coluna code adicionada à tabela routes';
    END IF;

    -- 2. Create MISSING route_points table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'route_points') THEN
        CREATE TABLE route_points (
            id UUID PRIMARY KEY,
            route_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            point_order INTEGER NOT NULL,
            type VARCHAR(50) NOT NULL,
            radius_meters INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
        );
        RAISE NOTICE 'Tabela route_points criada com sucesso';
    END IF;
END $$;
