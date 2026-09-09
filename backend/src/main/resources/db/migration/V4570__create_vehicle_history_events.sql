-- Migration V4570: Tabela de Eventos e Linha do Tempo Unificada do Veículo (Seção 22 e 23)

CREATE TABLE IF NOT EXISTS vehicle_history_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(20),
    event_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50) NOT NULL, -- ENTRADA_OPERACAO, OS_ABERTA, OS_CONCLUIDA, MANUTENCAO_PREVENTIVA, MANUTENCAO_CORRETIVA, CHECKLIST, INSPECAO, LAUDO, APRECIACAO_RISCO, ABASTECIMENTO, COMPRA_PECA, PECA_APLICADA, TROCA_PNEU, DOCUMENTO, ACIDENTE, BLOQUEIO, LIBERACAO, TRANSFERENCIA, ALTERACAO_CONTRATO
    description TEXT NOT NULL,
    responsible_name VARCHAR(200),
    cost DECIMAL(12,2) DEFAULT 0.00,
    cost_category VARCHAR(50), -- MANUTENCAO, PECAS, MAO_DE_OBRA, COMBUSTIVEL, COMPRAS, OUTROS
    
    related_entity_type VARCHAR(50), -- FleetWorkOrder, VehicleInspection, RiskAssessment, FuelRecord, PurchaseOrder, StockMovement, Document
    related_entity_id UUID,
    
    documents_urls TEXT,
    evidences_urls TEXT,
    
    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_vehicle ON vehicle_history_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_history_date ON vehicle_history_events(event_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_history_type ON vehicle_history_events(event_type);
