-- Migração para limpeza e recriação da tabela km_controls
-- V413__cleanup_km_controls_table.sql

-- Criar tabela km_controls se não existir
CREATE TABLE IF NOT EXISTS km_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    supervisor VARCHAR(255) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('GASOLINE', 'ETHANOL', 'DIESEL', 'FLEX')),
    initial_km INTEGER,
    final_km INTEGER,
    total_km INTEGER GENERATED ALWAYS AS (CASE WHEN initial_km IS NOT NULL AND final_km IS NOT NULL THEN final_km - initial_km ELSE NULL END) STORED,
    value DECIMAL(10,2),
    shift_start TIME,
    shift_end TIME,
    work_post VARCHAR(255),
    problem_description TEXT,
    work_post_performance TEXT,
    observations TEXT,
    initial_km_justification TEXT,
    final_km_justification TEXT,
    vehicle_id UUID,
    vehicle_plate VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_km_controls_date ON km_controls(date);
CREATE INDEX IF NOT EXISTS idx_km_controls_supervisor ON km_controls(supervisor);
CREATE INDEX IF NOT EXISTS idx_km_controls_vehicle_id ON km_controls(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_km_controls_vehicle_plate ON km_controls(vehicle_plate);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_km_controls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_update_km_controls_updated_at ON km_controls;
CREATE TRIGGER trigger_update_km_controls_updated_at
    BEFORE UPDATE ON km_controls
    FOR EACH ROW
    EXECUTE FUNCTION update_km_controls_updated_at();

-- Comentários para documentar a tabela
COMMENT ON TABLE km_controls IS 'Tabela para controle de quilometragem dos veículos';
COMMENT ON COLUMN km_controls.id IS 'Identificador único do registro';
COMMENT ON COLUMN km_controls.date IS 'Data do controle de quilometragem';
COMMENT ON COLUMN km_controls.supervisor IS 'Nome do supervisor responsável';
COMMENT ON COLUMN km_controls.fuel_type IS 'Tipo de combustível utilizado';
COMMENT ON COLUMN km_controls.initial_km IS 'Quilometragem inicial do dia';
COMMENT ON COLUMN km_controls.final_km IS 'Quilometragem final do dia';
COMMENT ON COLUMN km_controls.total_km IS 'Quilometragem total percorrida (calculada automaticamente)';
COMMENT ON COLUMN km_controls.value IS 'Valor gasto no dia';
COMMENT ON COLUMN km_controls.shift_start IS 'Horário de início do turno';
COMMENT ON COLUMN km_controls.shift_end IS 'Horário de fim do turno';
COMMENT ON COLUMN km_controls.work_post IS 'Posto de trabalho';
COMMENT ON COLUMN km_controls.problem_description IS 'Descrição de problemas encontrados';
COMMENT ON COLUMN km_controls.work_post_performance IS 'Desempenho no posto de trabalho';
COMMENT ON COLUMN km_controls.observations IS 'Observações gerais';
COMMENT ON COLUMN km_controls.initial_km_justification IS 'Justificativa para quilometragem inicial';
COMMENT ON COLUMN km_controls.final_km_justification IS 'Justificativa para quilometragem final';
COMMENT ON COLUMN km_controls.vehicle_id IS 'ID do veículo relacionado';
COMMENT ON COLUMN km_controls.vehicle_plate IS 'Placa do veículo';
COMMENT ON COLUMN km_controls.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN km_controls.updated_at IS 'Data da última atualização do registro';
