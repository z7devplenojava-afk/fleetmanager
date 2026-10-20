-- Migration V4644: Criar tabela services e popular catalogo de servicos de manutencao e operacao
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(100),
    code VARCHAR(50) UNIQUE,
    unit_price DECIMAL(10,2),
    unit VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_billable BOOLEAN DEFAULT true,
    requires_equipment BOOLEAN DEFAULT false,
    requires_certification BOOLEAN DEFAULT false,
    estimated_duration_hours INTEGER,
    min_employees_required INTEGER DEFAULT 1,
    max_employees_allowed INTEGER,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    company_id UUID
);

-- Indices para otimizacao de busca
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_code ON services(code);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_company_id ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);

-- Comentarios
COMMENT ON TABLE services IS 'Catalogo de servicos de manutencao de frota e servicos operacionais';
COMMENT ON COLUMN services.name IS 'Nome do servico';
COMMENT ON COLUMN services.description IS 'Descricao detalhada do servico';
COMMENT ON COLUMN services.category IS 'Categoria (ex: MANUTENCAO, ELETRICA, LAVAGEM, VIGILANCIA, PORTARIA)';
COMMENT ON COLUMN services.code IS 'Codigo unico do servico (ex: SRV-0001)';
COMMENT ON COLUMN services.unit_price IS 'Preco unitario padrao do servico';
COMMENT ON COLUMN services.unit IS 'Unidade de medida (UN, HORA, DIA)';
COMMENT ON COLUMN services.company_id IS 'Identificador da empresa tenant (nulo para servicos globais)';

-- Inserir catalogo de servicos de manutencao e operacao
DO $$
DECLARE
    v_promover_id UUID := 'ca74654d-91f3-47ff-8cc4-e685b66cbe2d';
BEGIN
    INSERT INTO services (id, name, description, category, code, unit_price, unit, status, is_billable, requires_equipment, requires_certification, estimated_duration_hours, min_employees_required, max_employees_allowed, company_id)
    VALUES
        (gen_random_uuid(), 'Troca de Óleo e Filtros', 'Substituição completa do óleo de motor e filtros (óleo, ar, combustível)', 'MANUTENCAO', 'SRV-0001', 250.00, 'UN', 'ACTIVE', true, true, false, 2, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Alinhamento e Balanceamento', 'Alinhamento de direção computadorizado e balanceamento das 4 rodas', 'MANUTENCAO', 'SRV-0002', 180.00, 'UN', 'ACTIVE', true, true, false, 2, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Revisão do Sistema de Freios', 'Inspeção completa de pastilhas, discos, tambores, fluído e sangria', 'MANUTENCAO', 'SRV-0003', 320.00, 'UN', 'ACTIVE', true, true, false, 3, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Troca de Pastilhas de Freio', 'Substituição de pastilhas dianteiras e/ou traseiras com limpeza de pinças', 'MANUTENCAO', 'SRV-0004', 280.00, 'UN', 'ACTIVE', true, true, false, 2, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Revisão Preventiva Geral', 'Checklist completo preventivo dos 50 itens da frota e inspeção visual', 'MANUTENCAO', 'SRV-0005', 450.00, 'UN', 'ACTIVE', true, true, false, 4, 1, 3, v_promover_id),
        (gen_random_uuid(), 'Troca e Rodízio de Pneus', 'Montagem, rodízio e calibragem de pneus dos eixos dianteiro e traseiro', 'MANUTENCAO', 'SRV-0006', 120.00, 'UN', 'ACTIVE', true, true, false, 1, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Sistema de Arrefecimento', 'Limpeza do radiador e reposição de líquido de arrefecimento aditivado', 'MANUTENCAO', 'SRV-0007', 220.00, 'UN', 'ACTIVE', true, true, false, 2, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Diagnóstico e Reparo Elétrico', 'Diagnóstico via scanner OBD2 e reparo de alternador, motor de partida ou chicotes', 'MANUTENCAO', 'SRV-0008', 200.00, 'UN', 'ACTIVE', true, true, false, 2, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Higienização e Carga Ar-Condicionado', 'Higienização com ozônio, troca do filtro de cabine e recarga de gás R134a', 'MANUTENCAO', 'SRV-0009', 300.00, 'UN', 'ACTIVE', true, true, false, 2, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Substituição de Bateria', 'Teste do alternador e instalação de bateria automotiva nova', 'MANUTENCAO', 'SRV-0010', 90.00, 'UN', 'ACTIVE', true, false, false, 1, 1, 1, v_promover_id),
        (gen_random_uuid(), 'Troca de Embreagem', 'Substituição do conjunto de platô, disco e rolamento de embreagem', 'MANUTENCAO', 'SRV-0011', 750.00, 'UN', 'ACTIVE', true, true, true, 6, 2, 3, v_promover_id),
        (gen_random_uuid(), 'Revisão de Suspensão e Amortecedores', 'Substituição de amortecedores, batentes, buchas, pivôs e bieletas', 'MANUTENCAO', 'SRV-0012', 480.00, 'UN', 'ACTIVE', true, true, false, 4, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Lavagem e Higienização Completa', 'Lavagem detalhada de chassi, motor, lataria e aspiração interna', 'LAVAGEM', 'SRV-0013', 80.00, 'UN', 'ACTIVE', true, false, false, 1, 1, 2, v_promover_id),
        (gen_random_uuid(), 'Vigilância 24h', 'Serviço de vigilância 24 horas por dia', 'VIGILANCIA', 'VIG-24H', 150.00, 'HORA', 'ACTIVE', true, true, true, 24, 2, 4, v_promover_id),
        (gen_random_uuid(), 'Portaria e Controle de Acesso', 'Serviço de portaria e recepção de unidades e bases operacionais', 'PORTARIA', 'PORT-01', 80.00, 'HORA', 'ACTIVE', true, false, false, 8, 1, 1, v_promover_id),
        (gen_random_uuid(), 'Ronda Motorizada Perimetral', 'Ronda externa com veículos e viaturas de apoio operacional', 'RONDA', 'RONDA-01', 110.00, 'HORA', 'ACTIVE', true, true, true, 2, 1, 2, v_promover_id)
    ON CONFLICT (code) DO NOTHING;
END $$;
