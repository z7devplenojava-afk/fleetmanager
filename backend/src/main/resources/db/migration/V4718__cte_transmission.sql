-- =====================================================================
-- CT-e 4.00: campos de transmissão real à SEFAZ
-- =====================================================================

ALTER TABLE electronic_ctes ADD COLUMN IF NOT EXISTS protocol_number VARCHAR(20);
ALTER TABLE electronic_ctes ADD COLUMN IF NOT EXISTS response_xml TEXT;
ALTER TABLE electronic_ctes ADD COLUMN IF NOT EXISTS rejection_code VARCHAR(20);
ALTER TABLE electronic_ctes ADD COLUMN IF NOT EXISTS rejection_message TEXT;
ALTER TABLE electronic_ctes ADD COLUMN IF NOT EXISTS environment VARCHAR(1);
ALTER TABLE electronic_ctes ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE electronic_ctes ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE electronic_ctes ADD COLUMN IF NOT EXISTS signed_xml TEXT;

COMMENT ON COLUMN electronic_ctes.protocol_number IS 'Número do protocolo de autorização devolvido pela SEFAZ';
COMMENT ON COLUMN electronic_ctes.signed_xml IS 'XML do CT-e assinado com o certificado A1';
COMMENT ON COLUMN electronic_ctes.response_xml IS 'XML de retorno da SEFAZ (retCTe / retConsSitCTe / retEventoCTe)';
COMMENT ON COLUMN electronic_ctes.environment IS 'Ambiente de emissão: 1=produção, 2=homologação';

CREATE INDEX IF NOT EXISTS idx_electronic_ctes_protocol ON electronic_ctes(protocol_number);
