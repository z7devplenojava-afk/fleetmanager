-- Migration V4613: Criar tabela de classificações de despesas / plano de contas e popular com as classificações padrão
CREATE TABLE IF NOT EXISTS expense_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50),
    name VARCHAR(150) NOT NULL UNIQUE,
    group_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_classifications_name ON expense_classifications(name);
CREATE INDEX IF NOT EXISTS idx_expense_classifications_is_active ON expense_classifications(is_active);

-- Inserir as classificações padrão do relatório SIGLO00058
INSERT INTO expense_classifications (name, group_name)
VALUES
    ('ADMINISTRATIVAS', 'Despesas Administrativas'),
    ('ALIMENTACAO', 'Benefícios e Pessoal'),
    ('ALUGUEL', 'Instalações e Operações'),
    ('BANCARIAS', 'Despesas Financeiras'),
    ('CAIXA', 'Operacional / Caixa'),
    ('CARTORIO', 'Despesas Administrativas / Legais'),
    ('COMBUSTIVEL', 'Operação de Frota'),
    ('CONSORCIO', 'Despesas Financeiras / Aquisições'),
    ('FINANCIAMENTO', 'Despesas Financeiras / Aquisições'),
    ('FOLHA PAGAMENTO VSS', 'Folha e Encargos'),
    ('FROTA (PEÇAS,SERVIÇOS,IPVA)', 'Manutenção e Operação de Frota'),
    ('GRATIFICACOES', 'Folha e Encargos'),
    ('IMPOSTOS', 'Tributos e Encargos Fiscais'),
    ('JUDICIAL', 'Jurídico e Contencioso'),
    ('LIMPEZA', 'Conservação e Higiene'),
    ('LOCACAO DE VEICULOS', 'Operação de Frota / Locação'),
    ('OBRAS', 'Infraestrutura e Reformas'),
    ('PARTICULAR DIRETORIA', 'Diretoria / Sócios'),
    ('PESSOAL', 'Recursos Humanos / Pessoal'),
    ('PLANO DE SAUDE', 'Benefícios e Pessoal'),
    ('SEGURANCA', 'Segurança Patrimonial e do Trabalho'),
    ('TRANSPORTE', 'Logística e Transporte')
ON CONFLICT (name) DO NOTHING;
