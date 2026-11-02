-- Migration V4647: Fix schema for positions, employees, employee_certifications and two_factor_codes

-- 1. Fix positions table: add cbo column
ALTER TABLE positions ADD COLUMN IF NOT EXISTS cbo VARCHAR(10);

-- 2. Fix employee_certifications table: add work_post_id
ALTER TABLE employee_certifications ADD COLUMN IF NOT EXISTS work_post_id UUID REFERENCES work_posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employee_certifications_work_post_id ON employee_certifications(work_post_id);

-- 2.1. Fix trainings table: add renewal_period_months and mandatory_for_guards
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS renewal_period_months INTEGER DEFAULT 12;
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS mandatory_for_guards BOOLEAN DEFAULT true;

-- 3. Fix two_factor_codes table: ensure expires_at exists
ALTER TABLE two_factor_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'two_factor_codes' AND column_name = 'expiry_date'
    ) THEN
        UPDATE two_factor_codes SET expires_at = expiry_date WHERE expires_at IS NULL;
    END IF;
END $$;

-- 4. Fix employees table: add all missing columns mapped in Employee.java
ALTER TABLE employees ADD COLUMN IF NOT EXISTS banco VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS agencia VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS conta_corrente VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carteira_identidade_data_emissao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carteira_identidade_orgao_emissor VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS certificado_militar VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS titulo_eleitor_zona VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS titulo_eleitor_secao VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salario_por_extenso TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS periodo_pagamento VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS horario_trabalho TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS folga_semanal VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_data_retratacao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS visto_fiscalizacao TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_pai VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_mae VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS local_nascimento VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_data_cadastro DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_banco_depositario VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_endereco_banco VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_codigo_banco VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_codigo_agencia VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_expiration_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_rural VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_series VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_issue_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_issuing_agency VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_digital_pdf TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_digital_pdf_nome VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_digital_pdf_tamanho BIGINT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carteira_modelo_19 VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS registro_geral_estrangeiro VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS casado_brasileiro BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_conjuge_estrangeiro VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(255);
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
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cin_numero VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cin_orgao_emissor VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cin_data_emissao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS telefone_contato VARCHAR(20);
