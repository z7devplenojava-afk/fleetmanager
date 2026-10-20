-- Seed da empresa Promover Terceirização e Serviços Ltda
-- Data: 2026-02-06
-- Motivo: Corrigir erro na importação de funcionários (CNPJ não encontrado)

ALTER TABLE companies ADD COLUMN IF NOT EXISTS sigla VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS endereco_rua VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(100);

INSERT INTO companies (
    id,
    name,
    trade_name,
    cnpj,
    sigla,
    address,
    city,
    state,
    zip_code,
    phone,
    email,
    website,
    status,
    type,
    sector,
    size,
    notes,
    endereco_rua,
    endereco_numero,
    endereco_bairro
) VALUES (
    gen_random_uuid(), -- ID gerado automaticamente
    'PROMOVER TERCEIRIZAÇÃO E SERVIÇOS LTDA',
    'Promover',
    '36.698.521/0001-01',
    'PTS',
    'Rua Pelegrino de Paula Ferreira, 77 - Centro, Contagem - MG, 32017-400',
    'Contagem',
    'MG',
    '32017-400',
    '(31) 2559-6834',
    'comercial@forteminasvigilancia.com.br',
    'https://alfaservices.com.br/',
    'ACTIVE',
    'LTDA',
    'Serviços e Terceirização',
    'Média',
    'Criado via migration para corrigir importação de funcionários',
    'Rua Pelegrino de Paula Ferreira',
    '77',
    'Centro'
) ON CONFLICT (cnpj) DO NOTHING;
