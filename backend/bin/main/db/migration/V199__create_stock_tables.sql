-- Criação das tabelas para o módulo de Estoque Simplificado

-- Tabela de itens de estoque
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    size_variation VARCHAR(20),
    description TEXT,
    current_quantity INTEGER NOT NULL DEFAULT 0,
    minimum_quantity INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    barcode VARCHAR(100),
    qr_code VARCHAR(100) UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    unit_id UUID,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_stock_item_unit FOREIGN KEY (unit_id) REFERENCES units(id),
    CONSTRAINT chk_stock_category CHECK (category IN (
        'UNIFORME_VIGILANCIA', 'UNIFORME_SERVICOS', 'UNIFORME_ADMINISTRATIVO', 
        'UNIFORME_COZINHA', 'EPI', 'ACESSORIOS', 'CALCADOS'
    )),
    CONSTRAINT chk_current_quantity CHECK (current_quantity >= 0),
    CONSTRAINT chk_minimum_quantity CHECK (minimum_quantity >= 0)
);

-- Tabela de movimentações de estoque
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id UUID NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    reason VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    employee_id UUID,
    employee_name VARCHAR(255),
    user_id UUID,
    user_name VARCHAR(255),
    document_number VARCHAR(100),
    supplier VARCHAR(255),
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    movement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    qr_code_used VARCHAR(100),
    unit_id UUID,
    
    CONSTRAINT fk_stock_movement_item FOREIGN KEY (stock_item_id) REFERENCES stock_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_movement_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_stock_movement_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_stock_movement_unit FOREIGN KEY (unit_id) REFERENCES units(id),
    CONSTRAINT chk_movement_type CHECK (movement_type IN ('ENTRADA', 'SAIDA')),
    CONSTRAINT chk_movement_reason CHECK (reason IN (
        'COMPRA', 'DEVOLUCAO', 'AJUSTE_ENTRADA', 'ENTREGA_INICIAL', 
        'REPOSICAO', 'TROCA', 'DESCARTE', 'PERDA', 'AJUSTE_SAIDA'
    )),
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_previous_quantity CHECK (previous_quantity >= 0),
    CONSTRAINT chk_new_quantity CHECK (new_quantity >= 0)
);

-- Tabela de alertas de estoque
CREATE TABLE stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id UUID NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    current_quantity INTEGER,
    minimum_quantity INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by_user_id UUID,
    priority INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_stock_alert_item FOREIGN KEY (stock_item_id) REFERENCES stock_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_alert_user FOREIGN KEY (resolved_by_user_id) REFERENCES users(id),
    CONSTRAINT chk_alert_type CHECK (alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED')),
    CONSTRAINT chk_priority CHECK (priority BETWEEN 1 AND 4)
);

-- Índices para melhor performance
CREATE INDEX idx_stock_items_code ON stock_items(code);
CREATE INDEX idx_stock_items_qr_code ON stock_items(qr_code);
CREATE INDEX idx_stock_items_category ON stock_items(category);
CREATE INDEX idx_stock_items_active ON stock_items(active);
CREATE INDEX idx_stock_items_unit ON stock_items(unit_id);
CREATE INDEX idx_stock_items_low_stock ON stock_items(current_quantity, minimum_quantity);

CREATE INDEX idx_stock_movements_item ON stock_movements(stock_item_id);
CREATE INDEX idx_stock_movements_employee ON stock_movements(employee_id);
CREATE INDEX idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_unit ON stock_movements(unit_id);

CREATE INDEX idx_stock_alerts_item ON stock_alerts(stock_item_id);
CREATE INDEX idx_stock_alerts_resolved ON stock_alerts(is_resolved);
CREATE INDEX idx_stock_alerts_read ON stock_alerts(is_read);
CREATE INDEX idx_stock_alerts_priority ON stock_alerts(priority);
CREATE INDEX idx_stock_alerts_created_at ON stock_alerts(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_stock_items_updated_at 
    BEFORE UPDATE ON stock_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo

-- Itens de estoque de exemplo
INSERT INTO stock_items (
    id, code, name, category, size_variation, description, 
    current_quantity, minimum_quantity, unit_cost, supplier, active
) VALUES 
-- Uniformes Vigilância
('11111111-1111-1111-1111-111111111111', 'UNI-VIG-CAM-P', 'Camisa Vigilância', 'UNIFORME_VIGILANCIA', 'P', 'Camisa manga longa azul marinho com distintivos', 15, 5, 45.00, 'Uniformes Brasil Ltda', true),
('22222222-2222-2222-2222-222222222222', 'UNI-VIG-CAM-M', 'Camisa Vigilância', 'UNIFORME_VIGILANCIA', 'M', 'Camisa manga longa azul marinho com distintivos', 8, 5, 45.00, 'Uniformes Brasil Ltda', true),
('33333333-3333-3333-3333-333333333333', 'UNI-VIG-CAM-G', 'Camisa Vigilância', 'UNIFORME_VIGILANCIA', 'G', 'Camisa manga longa azul marinho com distintivos', 12, 5, 45.00, 'Uniformes Brasil Ltda', true),
('44444444-4444-4444-4444-444444444444', 'UNI-VIG-CAL-40', 'Calça Vigilância', 'UNIFORME_VIGILANCIA', '40', 'Calça social azul marinho', 10, 3, 65.00, 'Uniformes Brasil Ltda', true),
('55555555-5555-5555-5555-555555555555', 'UNI-VIG-CAL-42', 'Calça Vigilância', 'UNIFORME_VIGILANCIA', '42', 'Calça social azul marinho', 6, 3, 65.00, 'Uniformes Brasil Ltda', true),

-- Calçados
('66666666-6666-6666-6666-666666666666', 'CAL-COT-40', 'Coturno', 'CALCADOS', '40', 'Coturno preto de couro legítimo', 4, 2, 120.00, 'Calçados Segurança S.A.', true),
('77777777-7777-7777-7777-777777777777', 'CAL-COT-42', 'Coturno', 'CALCADOS', '42', 'Coturno preto de couro legítimo', 3, 2, 120.00, 'Calçados Segurança S.A.', true),
('88888888-8888-8888-8888-888888888888', 'CAL-COT-44', 'Coturno', 'CALCADOS', '44', 'Coturno preto de couro legítimo', 1, 2, 120.00, 'Calçados Segurança S.A.', true),

-- EPIs
('99999999-9999-9999-9999-999999999999', 'EPI-CAP-UNI', 'Capacete de Segurança', 'EPI', 'Único', 'Capacete branco com jugular', 20, 5, 25.00, 'EPI Total Ltda', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EPI-LUV-M', 'Luvas de Segurança', 'EPI', 'M', 'Luvas de látex antiderrapante', 50, 10, 8.00, 'EPI Total Ltda', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EPI-LUV-G', 'Luvas de Segurança', 'EPI', 'G', 'Luvas de látex antiderrapante', 30, 10, 8.00, 'EPI Total Ltda', true),

-- Acessórios
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ACE-CIN-UNI', 'Cinto de Segurança', 'ACESSORIOS', 'Único', 'Cinto preto de nylon ajustável', 25, 5, 35.00, 'Acessórios Pro Ltda', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ACE-BON-UNI', 'Boné', 'ACESSORIOS', 'Único', 'Boné azul marinho com logo da empresa', 40, 10, 15.00, 'Acessórios Pro Ltda', true);

-- Movimentações de exemplo
INSERT INTO stock_movements (
    id, stock_item_id, movement_type, reason, quantity, previous_quantity, new_quantity,
    employee_name, user_name, movement_date, notes
) VALUES 
-- Entradas (compras)
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'ENTRADA', 'COMPRA', 20, 0, 20, NULL, 'Admin Sistema', '2025-08-01 09:00:00', 'Compra inicial - NF 12345'),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'ENTRADA', 'COMPRA', 15, 0, 15, NULL, 'Admin Sistema', '2025-08-01 09:15:00', 'Compra inicial - NF 12345'),
('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'ENTRADA', 'COMPRA', 10, 0, 10, NULL, 'Admin Sistema', '2025-08-02 14:30:00', 'Compra de calçados - NF 12346'),

-- Saídas (entregas a funcionários)
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'SAIDA', 'ENTREGA_INICIAL', 5, 20, 15, 'João Silva', 'Maria Santos', '2025-08-05 10:00:00', 'Kit inicial para novo funcionário'),
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'SAIDA', 'ENTREGA_INICIAL', 7, 15, 8, 'Carlos Lima', 'Maria Santos', '2025-08-06 11:30:00', 'Reposição de uniformes'),
('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'SAIDA', 'ENTREGA_INICIAL', 6, 10, 4, 'Ana Costa', 'Pedro Oliveira', '2025-08-07 15:45:00', 'Entrega de calçados para equipe'),
('77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', 'SAIDA', 'REPOSICAO', 1, 2, 1, 'Roberto Santos', 'Maria Santos', '2025-08-10 09:20:00', 'Reposição por desgaste');

-- Alertas de exemplo
INSERT INTO stock_alerts (
    id, stock_item_id, alert_type, message, current_quantity, minimum_quantity, 
    is_read, is_resolved, priority
) VALUES 
('11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'LOW_STOCK', 'Item "Coturno - 44" com baixo estoque: 1 unidades (mínimo: 2)', 1, 2, false, false, 3),
('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'LOW_STOCK', 'Item "Coturno - 42" com baixo estoque: 3 unidades (mínimo: 2)', 3, 2, true, false, 2);