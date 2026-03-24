-- Cria tabela de guias de transporte de armas e munições
CREATE TABLE transport_guides (
    id BIGSERIAL PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL,
    empresa VARCHAR(255) NOT NULL,
    numero_colete VARCHAR(50),
    numero_arma VARCHAR(50) NOT NULL,
    calibre VARCHAR(20) NOT NULL,
    qtd_municoes INTEGER NOT NULL,
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    trajeto TEXT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    arquivo_guia_path VARCHAR(500),
    created_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejected_by VARCHAR(255),
    rejected_at TIMESTAMP,
    rejection_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Índices para melhorar performance
CREATE INDEX idx_transport_guides_status ON transport_guides(status);
CREATE INDEX idx_transport_guides_empresa ON transport_guides(empresa);
CREATE INDEX idx_transport_guides_cnpj ON transport_guides(cnpj);
CREATE INDEX idx_transport_guides_created_by ON transport_guides(created_by);
CREATE INDEX idx_transport_guides_created_at ON transport_guides(created_at);



























