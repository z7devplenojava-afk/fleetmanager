-- Adiciona campos de Nota Fiscal (NF-e / NFS-e) e Beneficiário / CNPJ do Boleto nos serviços de borracharia

ALTER TABLE tire_shop_services ADD COLUMN IF NOT EXISTS nf_number VARCHAR(60);
ALTER TABLE tire_shop_services ADD COLUMN IF NOT EXISTS nf_key VARCHAR(100);
ALTER TABLE tire_shop_services ADD COLUMN IF NOT EXISTS nf_url TEXT;
ALTER TABLE tire_shop_services ADD COLUMN IF NOT EXISTS nf_original_name VARCHAR(255);
ALTER TABLE tire_shop_services ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(200);
ALTER TABLE tire_shop_services ADD COLUMN IF NOT EXISTS beneficiary_cnpj VARCHAR(30);

