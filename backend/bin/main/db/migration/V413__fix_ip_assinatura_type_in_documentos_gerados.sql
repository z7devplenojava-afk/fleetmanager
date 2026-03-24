-- Migration V413: Corrigir tipo da coluna ip_assinatura em documentos_gerados

-- Converter INET para VARCHAR
ALTER TABLE documentos_gerados
ALTER COLUMN ip_assinatura TYPE VARCHAR(255) USING ip_assinatura::TEXT;

COMMENT ON COLUMN documentos_gerados.ip_assinatura IS 'Endereço IP de onde a assinatura foi realizada';



