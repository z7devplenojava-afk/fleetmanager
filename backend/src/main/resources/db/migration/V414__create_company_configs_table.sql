-- Migração para criar tabela de configurações da empresa
-- Esta tabela armazena dados da empresa para geração de contratos

CREATE TABLE IF NOT EXISTS company_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    website VARCHAR(100),
    logo_url TEXT,
    header_text VARCHAR(200),
    footer_text VARCHAR(500),
    contract_terms TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_company_configs_active ON company_configs(active);
CREATE INDEX IF NOT EXISTS idx_company_configs_cnpj ON company_configs(cnpj);
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_configs_cnpj_active ON company_configs(cnpj) WHERE active = true;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_company_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS company_configs_updated_at_trigger ON company_configs;
CREATE TRIGGER company_configs_updated_at_trigger
    BEFORE UPDATE ON company_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_company_configs_updated_at();

-- Inserir dados de exemplo (opcional)
INSERT INTO company_configs (
    name, cnpj, address, city, state, zip_code, phone, email, website,
    header_text, footer_text, contract_terms, active
) VALUES (
    'Secure Guard Segurança Ltda',
    '12.345.678/0001-90',
    'Rua da Segurança, 123',
    'São Paulo',
    'SP',
    '01234-567',
    '(11) 9999-9999',
    'contato@secureguard.com.br',
    'www.secureguard.com.br',
    'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SEGURANÇA',
    'Este contrato é regido pelas leis brasileiras e foro da cidade de São Paulo/SP.',
    'CLÁUSULAS E CONDIÇÕES:

1. DO OBJETO: A CONTRATADA prestará serviços de segurança patrimonial conforme especificado neste contrato.

2. DAS OBRIGAÇÕES DA CONTRATADA:
   - Fornecer pessoal qualificado e treinado
   - Manter equipamentos em perfeito estado
   - Cumprir horários estabelecidos
   - Reportar ocorrências imediatamente

3. DAS OBRIGAÇÕES DA CONTRATANTE:
   - Efetuar pagamentos conforme prazo estabelecido
   - Fornecer acesso às dependências necessárias
   - Comunicar alterações com antecedência

4. DO VALOR E PAGAMENTO:
   - O valor será pago mensalmente até o dia 10
   - Reajustes conforme índices oficiais
   - Multa de 2% em caso de atraso

5. DA VIGÊNCIA:
   - Conforme período estabelecido no contrato
   - Renovação automática salvo manifestação contrária

6. DA RESCISÃO:
   - Comunicação prévia de 30 dias
   - Pagamento proporcional dos serviços prestados

7. DO FORO:
   - Foro da comarca de São Paulo/SP para questões judiciais',
    true
) ON CONFLICT DO NOTHING;
