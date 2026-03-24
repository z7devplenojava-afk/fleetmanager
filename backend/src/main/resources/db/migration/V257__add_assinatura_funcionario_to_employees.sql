-- Adicionar colunas faltantes à tabela employees
-- Baseado na entidade Employee.java

-- Assinatura do funcionário
ALTER TABLE employees ADD COLUMN IF NOT EXISTS assinatura_funcionario TEXT;

-- Dados da carteira de identidade
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carteira_identidade_data_emissao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carteira_identidade_orgao_emissor VARCHAR(50);

-- Carteira modelo 19
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carteira_modelo_19 VARCHAR(30);

-- Registro geral estrangeiro
ALTER TABLE employees ADD COLUMN IF NOT EXISTS registro_geral_estrangeiro VARCHAR(30);

-- Informações sobre cônjuge
ALTER TABLE employees ADD COLUMN IF NOT EXISTS casado_brasileiro BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_conjuge_estrangeiro VARCHAR(100);

-- Informações sobre filhos
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tem_filhos_brasileiros BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS quantidade_filhos_brasileiros INTEGER;

-- Dados de naturalização
ALTER TABLE employees ADD COLUMN IF NOT EXISTS data_chegada_brasil DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS naturalizado BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS decreto_naturalizacao VARCHAR(50);

-- Data de rescisão
ALTER TABLE employees ADD COLUMN IF NOT EXISTS data_rescisao DATE;

-- Certificado militar
ALTER TABLE employees ADD COLUMN IF NOT EXISTS certificado_militar VARCHAR(30);

-- CBO
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cbo VARCHAR(20);

-- Salário
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salario DECIMAL(10,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salario_por_extenso TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS periodo_pagamento VARCHAR(50);

-- Horário de trabalho
ALTER TABLE employees ADD COLUMN IF NOT EXISTS horario_trabalho TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS folga_semanal VARCHAR(50);

-- FGTS
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_optante BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_data_opcao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_banco_depositario VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_data_retratacao DATE;

-- Empresa
ALTER TABLE employees ADD COLUMN IF NOT EXISTS empresa_nome VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS empresa_endereco VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS empresa_cnpj VARCHAR(20);

-- Visto de fiscalização
ALTER TABLE employees ADD COLUMN IF NOT EXISTS visto_fiscalizacao TEXT;

-- Dados dos pais
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_pai VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_mae VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS local_nascimento VARCHAR(100);

-- Grau de instrução
ALTER TABLE employees ADD COLUMN IF NOT EXISTS grau_instrucao VARCHAR(50);

-- PIS
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_data_cadastro DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_banco_depositario VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_endereco_banco VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_codigo_banco VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_codigo_agencia VARCHAR(10);

-- CTPS Rural
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_rural VARCHAR(30);

-- Título de eleitor
ALTER TABLE employees ADD COLUMN IF NOT EXISTS titulo_eleitor_zona VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS titulo_eleitor_secao VARCHAR(10);

-- Comentários
COMMENT ON COLUMN employees.assinatura_funcionario IS 'Assinatura digital do funcionário';
COMMENT ON COLUMN employees.carteira_identidade_data_emissao IS 'Data de emissão da carteira de identidade';
COMMENT ON COLUMN employees.registro_geral_estrangeiro IS 'RG para estrangeiros';

