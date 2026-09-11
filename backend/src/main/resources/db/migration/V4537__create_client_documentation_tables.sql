-- V4537__create_client_documentation_tables.sql
-- Tabelas para gestão de documentação por cliente (anual/mensal)

-- Documentação do cliente para um período (ano/mês)
CREATE TABLE IF NOT EXISTS client_documentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, year, month)
);

-- Etapas da documentação (ex: 1ª Etapa, 2ª Etapa)
CREATE TABLE IF NOT EXISTS client_doc_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documentation_id UUID NOT NULL REFERENCES client_documentations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categorias de documentos pré-definidas ou customizadas
CREATE TABLE IF NOT EXISTS client_doc_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Arquivos enviados para uma etapa + categoria
CREATE TABLE IF NOT EXISTS client_doc_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES client_doc_stages(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES client_doc_categories(id) ON DELETE RESTRICT,
    original_name VARCHAR(255) NOT NULL,
    stored_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_docs_client_period ON client_documentations(client_id, year, month);
CREATE INDEX IF NOT EXISTS idx_client_docs_company ON client_documentations(company_id);
CREATE INDEX IF NOT EXISTS idx_client_doc_stages_doc ON client_doc_stages(documentation_id);
CREATE INDEX IF NOT EXISTS idx_client_doc_categories_company ON client_doc_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_client_doc_files_stage ON client_doc_files(stage_id);
CREATE INDEX IF NOT EXISTS idx_client_doc_files_category ON client_doc_files(category_id);

-- Inserir categorias padrão do sistema
INSERT INTO client_doc_categories (id, name, description, is_system, company_id) VALUES
    (gen_random_uuid(), '13º Salário', 'Documentos relacionados ao décimo terceiro salário', TRUE, NULL),
    (gen_random_uuid(), 'Cartão de Ponto', 'Registros de ponto dos funcionários', TRUE, NULL),
    (gen_random_uuid(), 'CND', 'Certidão Nacional de Débitos', TRUE, NULL),
    (gen_random_uuid(), 'CNDT', 'Certidão de Débitos Trabalhistas', TRUE, NULL),
    (gen_random_uuid(), 'Comprovante de Pagamento', 'Comprovantes de pagamento diversos', TRUE, NULL),
    (gen_random_uuid(), 'Convenção Coletiva', 'Convenções coletivas de trabalho', TRUE, NULL),
    (gen_random_uuid(), 'CRF', 'Certidão de Regularidade do FGTS', TRUE, NULL),
    (gen_random_uuid(), 'Desmobilização - Demitidos', 'Documentos de desmobilização de funcionários demitidos', TRUE, NULL),
    (gen_random_uuid(), 'Extrato FAP', 'Extrato do Fator Acidentário de Prevenção', TRUE, NULL),
    (gen_random_uuid(), 'Férias', 'Documentos relacionados a férias', TRUE, NULL),
    (gen_random_uuid(), 'Folha de Pagamento Analítico', 'Folha de pagamento analítica', TRUE, NULL),
    (gen_random_uuid(), 'Mobilizados no Mês', 'Relação de funcionários mobilizados no mês', TRUE, NULL),
    (gen_random_uuid(), 'Vale Alimentação', 'Documentos de vale alimentação', TRUE, NULL),
    (gen_random_uuid(), 'Vale Refeição', 'Documentos de vale refeição', TRUE, NULL),
    (gen_random_uuid(), 'Vale Transporte', 'Documentos de vale transporte', TRUE, NULL),
    (gen_random_uuid(), 'DCTFWeb', 'Declaração de Débitos Tributários Federais Web', TRUE, NULL),
    (gen_random_uuid(), 'eSocial', 'Arquivos do eSocial', TRUE, NULL),
    (gen_random_uuid(), 'GPS', 'Guia da Previdência Social', TRUE, NULL),
    (gen_random_uuid(), 'DARF', 'Documento de Arrecadação de Receitas Federais', TRUE, NULL),
    (gen_random_uuid(), 'Plano de Saúde', 'Documentos do plano de saúde', TRUE, NULL),
    (gen_random_uuid(), 'Seguro de Vida', 'Documentos do seguro de vida', TRUE, NULL);
