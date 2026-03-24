-- Criação das tabelas para gestão de modelos e geração de documentos dinâmicos

CREATE TABLE IF NOT EXISTS modelos_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_modelo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(10) NOT NULL CHECK (tipo_arquivo IN ('docx', 'pdf')),
    conteudo_template TEXT, -- NULL para PDFs não extraíveis
    arquivo_original BYTEA NOT NULL,
    nome_arquivo_original VARCHAR(255) NOT NULL,
    tamanho_arquivo BIGINT NOT NULL,
    placeholders JSON,
    versao VARCHAR(20) DEFAULT '1.0',
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES users(id),
    ativo BOOLEAN DEFAULT true,
    descricao TEXT,
    categoria VARCHAR(100) DEFAULT 'GERAL',
    extraivel BOOLEAN DEFAULT true -- false para PDFs escaneados/imagem
);

-- Garantir coluna extraivel quando a tabela já existia sem ela
ALTER TABLE modelos_documentos
    ADD COLUMN IF NOT EXISTS extraivel BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS documentos_gerados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo_id UUID NOT NULL REFERENCES modelos_documentos(id),
    funcionario_id UUID NOT NULL REFERENCES employees(id),
    conteudo_final TEXT, -- Conteúdo final com placeholders substituídos
    dados_preenchidos JSON,
    arquivo_gerado BYTEA NOT NULL, -- Sempre PDF
    nome_arquivo_gerado VARCHAR(255) NOT NULL,
    tamanho_arquivo_gerado BIGINT NOT NULL,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_assinatura TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'ASSINADO', 'VENCIDO', 'CANCELADO')),
    assinado_por UUID REFERENCES users(id),
    ip_assinatura INET,
    observacoes TEXT,
    data_vencimento TIMESTAMP,
    criado_por UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS assinaturas_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_gerado_id UUID NOT NULL REFERENCES documentos_gerados(id),
    usuario_id UUID NOT NULL REFERENCES users(id),
    tipo_assinatura VARCHAR(20) DEFAULT 'ELETRONICA' CHECK (tipo_assinatura IN ('ELETRONICA', 'DIGITAL')),
    ip_address INET,
    user_agent TEXT,
    data_assinatura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hash_assinatura VARCHAR(255),
    certificado_digital TEXT,
    observacoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_modelos_documentos_nome ON modelos_documentos(nome_modelo);
CREATE INDEX IF NOT EXISTS idx_modelos_documentos_categoria ON modelos_documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_modelos_documentos_ativo ON modelos_documentos(ativo);
CREATE INDEX IF NOT EXISTS idx_modelos_documentos_data_criacao ON modelos_documentos(data_criacao);

CREATE INDEX IF NOT EXISTS idx_documentos_gerados_modelo_id ON documentos_gerados(modelo_id);
CREATE INDEX IF NOT EXISTS idx_documentos_gerados_funcionario_id ON documentos_gerados(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_gerados_status ON documentos_gerados(status);
CREATE INDEX IF NOT EXISTS idx_documentos_gerados_data_criacao ON documentos_gerados(data_criacao);
CREATE INDEX IF NOT EXISTS idx_documentos_gerados_data_vencimento ON documentos_gerados(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_assinaturas_documento_id ON assinaturas_documentos(documento_gerado_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_usuario_id ON assinaturas_documentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_data ON assinaturas_documentos(data_assinatura);

-- Comentários nas tabelas
COMMENT ON TABLE modelos_documentos IS 'Armazena modelos de documentos com placeholders para geração dinâmica';
COMMENT ON TABLE documentos_gerados IS 'Armazena documentos gerados a partir dos modelos com dados preenchidos';
COMMENT ON TABLE assinaturas_documentos IS 'Histórico de assinaturas para auditoria e compliance';

-- Comentários nas colunas principais
COMMENT ON COLUMN modelos_documentos.tipo_arquivo IS 'Tipo do arquivo modelo: docx ou pdf';
COMMENT ON COLUMN modelos_documentos.conteudo_template IS 'Conteúdo extraído do arquivo (NULL para PDFs não extraíveis)';
COMMENT ON COLUMN modelos_documentos.extraivel IS 'Se o conteúdo pode ser extraído (false para PDFs escaneados)';
COMMENT ON COLUMN modelos_documentos.placeholders IS 'JSON com lista de placeholders encontrados no template (ex: ["nome", "cpf", "cargo"])';
COMMENT ON COLUMN documentos_gerados.arquivo_gerado IS 'Arquivo PDF final gerado (sempre PDF independente do modelo original)';
COMMENT ON COLUMN documentos_gerados.dados_preenchidos IS 'JSON com os dados utilizados para preencher os placeholders';
COMMENT ON COLUMN documentos_gerados.status IS 'Status do documento: PENDENTE, ASSINADO, VENCIDO, CANCELADO';
COMMENT ON COLUMN assinaturas_documentos.hash_assinatura IS 'Hash único da assinatura para integridade';
