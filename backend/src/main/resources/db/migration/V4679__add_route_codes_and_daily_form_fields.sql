-- Migration V4679: Códigos de Percurso (01 a 15 + customizáveis por empresa) e campos do Formulário Diário do Motorista

CREATE TABLE IF NOT EXISTS driver_route_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    description VARCHAR(150) NOT NULL,
    requires_justification BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    company_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_driver_route_codes_company ON driver_route_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_driver_route_codes_code ON driver_route_codes(code);

-- Inserir os 15 códigos padrão globais (company_id IS NULL) se não existirem
INSERT INTO driver_route_codes (code, description, requires_justification, display_order, active, company_id)
SELECT v.code, v.description, v.req_just, v.ord, TRUE, NULL
FROM (VALUES
    ('01', 'CASA/PONTO', FALSE, 1),
    ('02', 'CASA/GARAGEM', FALSE, 2),
    ('03', 'CASA/FÁBRICA', FALSE, 3),
    ('04', 'PONTO/CASA', FALSE, 4),
    ('05', 'PONTO/GARAGEM', FALSE, 5),
    ('06', 'PONTO/FÁBRICA', FALSE, 6),
    ('07', 'GARAGEM/CASA', FALSE, 7),
    ('08', 'GARAGEM/PONTO', FALSE, 8),
    ('09', 'GARAGEM/FÁBRICA', FALSE, 9),
    ('10', 'FÁBRICA/CASA', FALSE, 10),
    ('11', 'FÁBRICA/PONTO', FALSE, 11),
    ('12', 'FÁBRICA/GARAGEM', FALSE, 12),
    ('13', 'FÁBRICA/FÁBRICA', FALSE, 13),
    ('14', 'FINAL/FÁBRICA', FALSE, 14),
    ('15', 'OUTROS', TRUE, 15)
) AS v(code, description, req_just, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM driver_route_codes d WHERE d.code = v.code AND d.company_id IS NULL
);

-- Adicionar campos do Quadro Diário nas atividades da Parte Diária
ALTER TABLE parte_diaria_atividades
    ADD COLUMN IF NOT EXISTS route_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS start_km INTEGER,
    ADD COLUMN IF NOT EXISTS end_km INTEGER,
    ADD COLUMN IF NOT EXISTS passengers_count INTEGER;

