-- Adicionar campos de assinatura na tabela documents
ALTER TABLE documents 
ADD COLUMN signed BOOLEAN DEFAULT FALSE,
ADD COLUMN signature_date TIMESTAMP,
ADD COLUMN signed_by VARCHAR(255);

-- Criar tabela de assinaturas eletrônicas
CREATE TABLE document_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    signer_name VARCHAR(255) NOT NULL,
    signer_cpf VARCHAR(14) NOT NULL,
    signer_role VARCHAR(100) NOT NULL,
    signer_ip VARCHAR(45) NOT NULL,
    signature_hash VARCHAR(64) NOT NULL UNIQUE,
    signature_date TIMESTAMP NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_document_signatures_document 
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT uk_document_signatures_hash UNIQUE (signature_hash)
);

-- Criar índices para melhor performance
CREATE INDEX idx_document_signatures_document_id ON document_signatures(document_id);
CREATE INDEX idx_document_signatures_signer_cpf ON document_signatures(signer_cpf);
CREATE INDEX idx_document_signatures_signature_date ON document_signatures(signature_date);
CREATE INDEX idx_documents_signed ON documents(signed);
CREATE INDEX idx_documents_signature_date ON documents(signature_date); 