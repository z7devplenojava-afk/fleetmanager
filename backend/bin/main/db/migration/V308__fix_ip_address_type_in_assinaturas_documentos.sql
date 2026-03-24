-- Migration V308: Corrigir tipo da coluna ip_address em assinaturas_documentos

-- Converter INET para VARCHAR
ALTER TABLE assinaturas_documentos
ALTER COLUMN ip_address TYPE VARCHAR(255) USING ip_address::TEXT;

COMMENT ON COLUMN assinaturas_documentos.ip_address IS 'Endereço IP de onde a assinatura foi realizada';

