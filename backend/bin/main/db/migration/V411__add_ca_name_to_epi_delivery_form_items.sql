-- Adicionar campo ca_name para armazenar o nome/descrição do CA
ALTER TABLE epi_delivery_form_items 
ADD COLUMN IF NOT EXISTS ca_name VARCHAR(255);

-- Comentário explicativo
COMMENT ON COLUMN epi_delivery_form_items.ca_name IS 'Nome/Descrição do Certificado de Aprovação (CA) obtido da API CA EPI';

