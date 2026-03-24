-- Migration: V273__create_equipments_table.sql
-- Criar tabela para gestão de equipamentos de segurança

CREATE TABLE equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL,
    ballistic_plate VARCHAR(100),
    manufacturing_date DATE NOT NULL,
    six_year_expiry DATE,
    weapon_registration_validity DATE,
    usage_type VARCHAR(50),
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    ca_number VARCHAR(50),
    protection_level VARCHAR(10),
    batch VARCHAR(100),
    model VARCHAR(100),
    size VARCHAR(10),
    validity_date DATE,
    is_dangerous BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    qr_code VARCHAR(255),
    current_user_id UUID,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipment_current_user FOREIGN KEY (current_user_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Criar índices para otimizar consultas
CREATE INDEX idx_equipment_status ON equipments(status);
CREATE INDEX idx_equipment_serial_number ON equipments(serial_number);
CREATE INDEX idx_equipment_current_user ON equipments(current_user_id);
CREATE INDEX idx_equipment_validity_date ON equipments(validity_date);
CREATE INDEX idx_equipment_weapon_registration_validity ON equipments(weapon_registration_validity);
CREATE INDEX idx_equipment_manufacturing_date ON equipments(manufacturing_date);
CREATE INDEX idx_equipment_protection_level ON equipments(protection_level);
CREATE INDEX idx_equipment_is_dangerous ON equipments(is_dangerous);
CREATE INDEX idx_equipment_batch ON equipments(batch);
CREATE INDEX idx_equipment_model ON equipments(model);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipment_updated_at
    BEFORE UPDATE ON equipments
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_updated_at();

-- Inserir dados de exemplo para testes
INSERT INTO equipments (
    status, ballistic_plate, manufacturing_date, weapon_registration_validity,
    usage_type, serial_number, ca_number, protection_level, batch, model,
    size, validity_date, is_dangerous, notes
) VALUES
(
    'EM_ESTOQUE', 'BP-001', '2020-01-15', '2025-12-31',
    'USO_DIARIO', 'EQ-001-2020', 'CA-12345', 'IIIA', 'LOTE-2020-01',
    'Colete Balístico Modelo X', 'M', '2025-01-15', true,
    'Colete balístico nível IIIA em perfeito estado'
),
(
    'EM_ESTOQUE', 'BP-002', '2021-03-20', NULL,
    'USO_EVENTUAL', 'EQ-002-2021', 'CA-12346', 'II', 'LOTE-2021-03',
    'Capacete Balístico Y', 'G', '2026-03-20', false,
    'Capacete de proteção nível II'
),
(
    'EM_ESTOQUE', NULL, '2019-11-10', '2024-11-10',
    'RESERVADO', 'EQ-003-2019', 'CA-12347', 'III', 'LOTE-2019-11',
    'Escudo Balístico Z', 'UNICO', '2024-11-10', true,
    'Escudo balístico para situações especiais'
); 