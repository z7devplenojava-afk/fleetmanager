-- Script para recriar a tabela vehicle_maintenances
-- Execute este script diretamente no seu banco de dados PostgreSQL

-- Verificar dados existentes antes do backup
SELECT 
    COUNT(*) as registros_antes,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Há dados para preservar'
        ELSE 'ℹ️ Tabela vazia, não há dados para preservar'
    END as status_dados
FROM vehicle_maintenances;

-- 1. Criar tabela temporária para backup dos dados
CREATE TABLE IF NOT EXISTS vehicle_maintenances_backup AS 
SELECT * FROM vehicle_maintenances;

-- 2. Dropar a tabela atual (isso remove todos os índices e constraints automaticamente)
DROP TABLE IF EXISTS vehicle_maintenances CASCADE;

-- 3. Recriar a tabela com todas as colunas necessárias
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

-- 4. Recriar índices para melhorar performance
CREATE INDEX idx_vehicle_maintenances_vehicle_id ON vehicle_maintenances(vehicle_id);
CREATE INDEX idx_vehicle_maintenances_date ON vehicle_maintenances(date);
CREATE INDEX idx_vehicle_maintenances_status ON vehicle_maintenances(status);
CREATE INDEX idx_vehicle_maintenances_priority ON vehicle_maintenances(priority);

-- 5. Adicionar comentários para documentação
COMMENT ON TABLE vehicle_maintenances IS 'Tabela de manutenções de veículos';
COMMENT ON COLUMN vehicle_maintenances.photos IS 'Lista de URLs das fotos da manutenção (JSON array)';
COMMENT ON COLUMN vehicle_maintenances.documents IS 'Lista de URLs dos documentos da manutenção (JSON array)';

-- 6. Restaurar dados do backup (apenas colunas que existiam)
INSERT INTO vehicle_maintenances (
    id, vehicle_id, date, maintenance_type, description, 
    cost, provider, mileage, status, priority, notes, 
    created_at, updated_at
)
SELECT 
    id, vehicle_id, date, maintenance_type, description, 
    cost, provider, mileage, status, priority, notes, 
    created_at, updated_at
FROM vehicle_maintenances_backup;

-- 7. Dropar tabela de backup
DROP TABLE vehicle_maintenances_backup;

-- 8. Verificar se a tabela foi criada corretamente
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

-- 9. Verificar se há dados na tabela após a recriação
SELECT 
    COUNT(*) as registros_depois,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Dados restaurados com sucesso'
        ELSE '⚠️ Tabela vazia após restauração'
    END as status_restauracao
FROM vehicle_maintenances;

-- 10. Testar se a tabela pode ser consultada
SELECT 
    id, 
    vehicle_id, 
    date, 
    maintenance_type, 
    status,
    priority
FROM vehicle_maintenances 
LIMIT 5;
