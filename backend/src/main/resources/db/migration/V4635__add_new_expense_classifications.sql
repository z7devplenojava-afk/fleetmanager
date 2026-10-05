-- Migration V4635: Adicionar classificações de despesas para Locação de Veículos, Multas de Trânsito, Taxas com Mobilização e Rastreadores de Veículos
INSERT INTO expense_classifications (name, group_name)
VALUES
    ('LOCACAO DE VEICULOS', 'Operação de Frota / Locação'),
    ('MULTAS DE TRANSITO', 'Infrações e Multas de Frota'),
    ('TAXAS COM MOBILIZACAO', 'Operação de Frota / Mobilização'),
    ('RASTREADORES DE VEICULOS', 'Tecnologia e Rastreadores de Frota')
ON CONFLICT (name) DO NOTHING;
