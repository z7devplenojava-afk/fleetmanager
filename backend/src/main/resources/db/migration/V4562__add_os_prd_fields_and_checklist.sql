-- V4562__add_os_prd_fields_and_checklist.sql
-- Ampliacao da tabela fleet_work_orders e criacao do modulo de checklist de manutencao preventiva conforme PRD

-- 1. Novos campos em fleet_work_orders
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS maintenance_type VARCHAR(30) DEFAULT 'CORRETIVA';
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS stop_date DATE;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS stop_time VARCHAR(10);
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS exit_date DATE;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS exit_time VARCHAR(10);
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS aggregate_info VARCHAR(100);
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS anomalies_description TEXT;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS other_description TEXT;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS maintenance_performed TEXT;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS sector_id UUID;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS requester_id UUID;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS responsible_id UUID;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS supervisor_id UUID;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS responsible_signature TEXT;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS responsible_signature_date TIMESTAMP;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS supervisor_signature TEXT;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS supervisor_signature_date TIMESTAMP;

-- 2. Tabela checklist_itens (Catalogo de Itens de Inspecao)
CREATE TABLE IF NOT EXISTS checklist_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    tipo_manutencao VARCHAR(30) DEFAULT 'PREVENTIVA',
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    company_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela ordem_servico_checklist (Respostas do Checklist por OS)
CREATE TABLE IF NOT EXISTS ordem_servico_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_servico_id UUID NOT NULL REFERENCES fleet_work_orders(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES checklist_itens(id) ON DELETE CASCADE,
    situacao VARCHAR(20) NOT NULL DEFAULT 'OK',
    observacao TEXT,
    reparo_realizado TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_os_checklist_work_order ON ordem_servico_checklist(ordem_servico_id);

-- 4. Insercao de Itens Iniciais Padrao no Checklist (Se nao existirem)
INSERT INTO checklist_itens (descricao, categoria, tipo_manutencao, ordem, ativo)
SELECT d.descricao, d.categoria, 'PREVENTIVA', d.ordem, TRUE
FROM (VALUES
    -- Mecanica
    ('Conferir barras e ponteiras', 'MECANICA', 1),
    ('Conferir coifa', 'MECANICA', 2),
    ('Conferir mangas de eixo', 'MECANICA', 3),
    ('Conferir vazamentos pneumaticos', 'MECANICA', 4),
    ('Conferir freio de estacionamento', 'MECANICA', 5),
    ('Conferir amortecedores', 'MECANICA', 6),
    ('Conferir estabilizadores', 'MECANICA', 7),
    ('Conferir cucas', 'MECANICA', 8),
    ('Conferir lonas', 'MECANICA', 9),
    ('Conferir catracas de freio', 'MECANICA', 10),
    ('Conferir freio motor', 'MECANICA', 11),
    ('Conferir cubos dianteiros e traseiros', 'MECANICA', 12),
    ('Conferir folga eixo S', 'MECANICA', 13),
    ('Conferir flange da caixa de cambio', 'MECANICA', 14),
    ('Conferir cruzeta', 'MECANICA', 15),
    ('Conferir embreagem', 'MECANICA', 16),
    ('Conferir pinos de centro do feixe de molas', 'MECANICA', 17),
    ('Lubrificar feixe de molas', 'MECANICA', 18),
    ('Lubrificar rolamentos', 'MECANICA', 19),
    ('Lubrificar cruzetas', 'MECANICA', 20),
    ('Lubrificar sistema de freio', 'MECANICA', 21),
    ('Conferir rolamento central', 'MECANICA', 22),
    ('Conferir mancal/eixo cardan', 'MECANICA', 23),
    -- Eletrica
    ('Conferir polos da bateria', 'ELETRICA', 24),
    ('Conferir cabos da bateria', 'ELETRICA', 25),
    ('Conferir carregamento da bateria (27V)', 'ELETRICA', 26),
    ('Conferir parte eletrica', 'ELETRICA', 27),
    ('Conferir farol, farolete, lanternas, seta e buzina', 'ELETRICA', 28),
    -- Motor
    ('Conferir oleo do motor', 'MOTOR', 29),
    ('Conferir filtros', 'MOTOR', 30),
    ('Conferir radiador e arrefecimento', 'MOTOR', 31),
    ('Conferir motor e correias', 'MOTOR', 32),
    -- Pneus
    ('Conferir pneus, calibracao e aperto dos parafusos', 'PNEUS', 33),
    -- Carroceria
    ('Conferir carroceria, porta-malas e painel de instrucao', 'CARROCERIA', 34)
) AS d(descricao, categoria, ordem)
WHERE NOT EXISTS (
    SELECT 1 FROM checklist_itens WHERE descricao = d.descricao
);
