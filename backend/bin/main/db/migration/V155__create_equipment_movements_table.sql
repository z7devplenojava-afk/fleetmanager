-- Migration: V274__create_equipment_movements_table.sql
-- Criar tabela para histórico de movimentações de equipamentos

CREATE TABLE equipment_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    work_post_id UUID,
    authorized_by_id UUID NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    movement_date TIMESTAMP NOT NULL,
    expected_return_date TIMESTAMP,
    actual_return_date TIMESTAMP,
    reason VARCHAR(500),
    notes TEXT,
    returned BOOLEAN NOT NULL DEFAULT FALSE,
    condition_on_withdrawal VARCHAR(100),
    condition_on_return VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipment_movement_equipment FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE CASCADE,
    CONSTRAINT fk_equipment_movement_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_equipment_movement_work_post FOREIGN KEY (work_post_id) REFERENCES work_posts(id) ON DELETE SET NULL,
    CONSTRAINT fk_equipment_movement_authorized_by FOREIGN KEY (authorized_by_id) REFERENCES employees(id) ON DELETE RESTRICT
);

-- Criar índices para otimizar consultas
CREATE INDEX idx_equipment_movement_equipment ON equipment_movements(equipment_id);
CREATE INDEX idx_equipment_movement_employee ON equipment_movements(employee_id);
CREATE INDEX idx_equipment_movement_work_post ON equipment_movements(work_post_id);
CREATE INDEX idx_equipment_movement_authorized_by ON equipment_movements(authorized_by_id);
CREATE INDEX idx_equipment_movement_type ON equipment_movements(movement_type);
CREATE INDEX idx_equipment_movement_date ON equipment_movements(movement_date);
CREATE INDEX idx_equipment_movement_returned ON equipment_movements(returned);
CREATE INDEX idx_equipment_movement_expected_return ON equipment_movements(expected_return_date);
CREATE INDEX idx_equipment_movement_overdue ON equipment_movements(returned, expected_return_date);

-- Inserir dados de exemplo para demonstração
-- Primeiro, vamos buscar alguns IDs para usar como exemplo
INSERT INTO equipment_movements (
    equipment_id, employee_id, authorized_by_id, movement_type, 
    movement_date, expected_return_date, reason, condition_on_withdrawal, returned
) 
SELECT 
    e.id as equipment_id,
    emp.id as employee_id,
    emp.id as authorized_by_id,  -- Para exemplo, mesmo funcionário autoriza
    'WITHDRAWAL' as movement_type,
    CURRENT_TIMESTAMP - INTERVAL '5 days' as movement_date,
    CURRENT_TIMESTAMP + INTERVAL '25 days' as expected_return_date,
    'Uso operacional' as reason,
    'Bom estado' as condition_on_withdrawal,
    false as returned
FROM equipments e
CROSS JOIN employees emp
WHERE e.serial_number = 'EQ-001-2020'
  AND emp.name LIKE '%Admin%'
LIMIT 1;

-- Adicionar uma movimentação já devolvida como exemplo
INSERT INTO equipment_movements (
    equipment_id, employee_id, authorized_by_id, movement_type, 
    movement_date, expected_return_date, actual_return_date, 
    reason, condition_on_withdrawal, condition_on_return, returned
) 
SELECT 
    e.id as equipment_id,
    emp.id as employee_id,
    emp.id as authorized_by_id,
    'TEMPORARY_USE' as movement_type,
    CURRENT_TIMESTAMP - INTERVAL '15 days' as movement_date,
    CURRENT_TIMESTAMP - INTERVAL '5 days' as expected_return_date,
    CURRENT_TIMESTAMP - INTERVAL '3 days' as actual_return_date,
    'Treinamento' as reason,
    'Bom estado' as condition_on_withdrawal,
    'Bom estado - sem avarias' as condition_on_return,
    true as returned
FROM equipments e
CROSS JOIN employees emp
WHERE e.serial_number = 'EQ-002-2021'
  AND emp.name LIKE '%Admin%'
LIMIT 1; 