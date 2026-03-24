-- Migration para adicionar colunas faltantes na tabela employees
-- Data: 2025-10-17
-- Descrição: Adiciona TODAS as colunas que existem no Model mas não no banco, incluindo relações

-- ========================================
-- PARTE 1: Colunas de Dados (50 colunas)
-- ========================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(1);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS rg VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carteira_identidade_data_emissao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carteira_identidade_orgao_emissor VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS certificado_militar VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS titulo_eleitor_zona VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS titulo_eleitor_secao VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cbo VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salario NUMERIC(10,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salario_por_extenso TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS periodo_pagamento VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS horario_trabalho TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS folga_semanal VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_optante BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_data_opcao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_banco_depositario VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_data_retratacao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS empresa_nome VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS empresa_endereco VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS empresa_cnpj VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS visto_fiscalizacao TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_pai VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_mae VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS local_nascimento VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS grau_instrucao VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_data_cadastro DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_banco_depositario VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_endereco_banco VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_codigo_banco VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_codigo_agencia VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(5);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_expiration_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_rural VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carteira_modelo_19 VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS registro_geral_estrangeiro VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS casado_brasileiro BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_conjuge_estrangeiro VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_cpf VARCHAR(14);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_rg VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_birth_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_email VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tem_filhos_brasileiros BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS quantidade_filhos_brasileiros INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS data_chegada_brasil DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS naturalizado BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS decreto_naturalizacao VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS assinatura_funcionario TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS data_rescisao DATE;

-- ========================================
-- PARTE 2: Coluna de Relação company_id
-- ========================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id UUID;

-- ========================================
-- PARTE 3: Constraints e Índices
-- ========================================

-- Adicionar constraint de foreign key para company_id (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_employee_company'
    ) THEN
        ALTER TABLE employees 
        ADD CONSTRAINT fk_employee_company 
        FOREIGN KEY (company_id) 
        REFERENCES companies(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_gender ON employees(gender);
CREATE INDEX IF NOT EXISTS idx_employees_rg ON employees(rg);
CREATE INDEX IF NOT EXISTS idx_employees_pis ON employees(pis);
CREATE INDEX IF NOT EXISTS idx_employees_cbo ON employees(cbo);
CREATE INDEX IF NOT EXISTS idx_employees_cnh_category ON employees(cnh_category);

-- ========================================
-- PARTE 4: Comentários nas Colunas
-- ========================================

COMMENT ON COLUMN employees.gender IS 'Gênero do funcionário (M/F)';
COMMENT ON COLUMN employees.rg IS 'Número do RG';
COMMENT ON COLUMN employees.carteira_identidade_data_emissao IS 'Data de emissão da carteira de identidade (RG)';
COMMENT ON COLUMN employees.carteira_identidade_orgao_emissor IS 'Órgão emissor do RG';
COMMENT ON COLUMN employees.certificado_militar IS 'Número do certificado militar';
COMMENT ON COLUMN employees.titulo_eleitor_zona IS 'Zona do título de eleitor';
COMMENT ON COLUMN employees.titulo_eleitor_secao IS 'Seção do título de eleitor';
COMMENT ON COLUMN employees.cbo IS 'Código Brasileiro de Ocupações';
COMMENT ON COLUMN employees.pis IS 'Número do PIS/PASEP';
COMMENT ON COLUMN employees.salario IS 'Salário do funcionário';
COMMENT ON COLUMN employees.company_id IS 'ID da empresa à qual o funcionário está vinculado';
COMMENT ON COLUMN employees.cnh_category IS 'Categoria da CNH (A, B, AB, C, D, E)';
COMMENT ON COLUMN employees.cnh_expiration_date IS 'Data de validade da CNH';
COMMENT ON COLUMN employees.spouse_name IS 'Nome do cônjuge';
COMMENT ON COLUMN employees.spouse_cpf IS 'CPF do cônjuge';
COMMENT ON COLUMN employees.fgts_optante IS 'Indica se o funcionário é optante do FGTS';
COMMENT ON COLUMN employees.pis_data_cadastro IS 'Data de cadastro do PIS/PASEP';
