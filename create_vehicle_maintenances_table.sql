-- Script para recriar a tabela vehicle_maintenances do zero
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Criar a tabela vehicle_maintenances com todas as colunas necessárias
CREATE TABLE vehicle_maintenances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    date DATE NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2),
    provider VARCHAR(200),
    mileage INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    notes TEXT,
    photos TEXT, -- Lista de URLs das fotos (JSON array)
    documents TEXT, -- Lista de URLs dos documentos (JSON array)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- 2. Criar índices para melhorar performance
CREATE INDEX idx_vehicle_maintenances_vehicle_id ON vehicle_maintenances(vehicle_id);
CREATE INDEX idx_vehicle_maintenances_date ON vehicle_maintenances(date);
CREATE INDEX idx_vehicle_maintenances_status ON vehicle_maintenances(status);
CREATE INDEX idx_vehicle_maintenances_priority ON vehicle_maintenances(priority);

-- 3. Adicionar comentários para documentação
COMMENT ON TABLE vehicle_maintenances IS 'Tabela de manutenções de veículos';
COMMENT ON COLUMN vehicle_maintenances.photos IS 'Lista de URLs das fotos da manutenção (JSON array)';
COMMENT ON COLUMN vehicle_maintenances.documents IS 'Lista de URLs dos documentos da manutenção (JSON array)';

-- 4. Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE 
        WHEN column_name IN ('photos', 'documents') THEN '✅ Nova coluna'
        ELSE 'Existe'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vehicle_maintenances' 
ORDER BY ordinal_position;

-- 5. Verificar se a tabela está vazia (deve estar vazia após recriação)
SELECT 
    COUNT(*) as total_registros,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Tabela criada corretamente (vazia)'
        ELSE '⚠️ Tabela tem dados inesperados'
    END as status
FROM vehicle_maintenances;
