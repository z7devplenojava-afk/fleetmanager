-- Tabela de unidades
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units') THEN
        CREATE TABLE units (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            address VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(100) UNIQUE,
            parent_id UUID,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES units(id)
        );
    END IF;
END $$;

-- Tabela de cargos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'positions') THEN
        CREATE TABLE positions (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            base_salary NUMERIC(10,2),
            unit_id UUID NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (unit_id) REFERENCES units(id)
        );
    END IF;
END $$;

-- Tabela de funcionários (COMPLETA com todas as colunas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        CREATE TABLE employees (
            id UUID PRIMARY KEY,
    user_id UUID,
    position_id UUID,
    registration_number VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    document VARCHAR(14),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(1),
    marital_status VARCHAR(50),
    nationality VARCHAR(50),
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    unit_id UUID,
    company_id UUID,
    hire_date DATE NOT NULL,
    termination_date DATE,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    photo_url VARCHAR(255),
    
    -- Documentos pessoais
    cnh_number VARCHAR(20),
    cnh_expiration_date DATE,
    cnh_category VARCHAR(5),
    ctps VARCHAR(30),
    ctps_series VARCHAR(10),
    ctps_issue_date DATE,
    ctps_issuing_agency VARCHAR(100),
    ctps_rural VARCHAR(30),
    titulo_eleitor VARCHAR(20),
    titulo_eleitor_zona VARCHAR(10),
    titulo_eleitor_secao VARCHAR(10),
    carteira_identidade_orgao_emissor VARCHAR(50),
    carteira_identidade_data_emissao DATE,
    certificado_militar VARCHAR(30),
    
    -- Dados profissionais
    cbo VARCHAR(20),
    pis VARCHAR(20),
    salario NUMERIC(10,2),
    salario_por_extenso TEXT,
    periodo_pagamento VARCHAR(50),
    horario_trabalho TEXT,
    folga_semanal VARCHAR(50),
    fgts_optante BOOLEAN,
    fgts_data_opcao DATE,
    fgts_banco_depositario VARCHAR(100),
    fgts_data_retratacao DATE,
    pis_data_cadastro DATE,
    pis_banco_depositario VARCHAR(100),
    pis_endereco_banco VARCHAR(255),
    pis_codigo_banco VARCHAR(10),
    pis_codigo_agencia VARCHAR(10),
    
    -- Visto de fiscalização
    visto_fiscalizacao TEXT,
    
    -- Dados familiares e pessoais
    nome_pai VARCHAR(100),
    nome_mae VARCHAR(100),
    local_nascimento VARCHAR(100),
    grau_instrucao VARCHAR(50),
    
    -- Documentos especiais
    carteira_modelo_19 VARCHAR(30),
    registro_geral_estrangeiro VARCHAR(30),
    
    -- Dados do cônjuge
    casado_brasileiro BOOLEAN,
    nome_conjuge_estrangeiro VARCHAR(100),
    spouse_name VARCHAR(100),
    spouse_cpf VARCHAR(14),
    spouse_rg VARCHAR(20),
    spouse_birth_date DATE,
    spouse_phone VARCHAR(20),
    spouse_email VARCHAR(100),
    
    -- Dados de filhos
    tem_filhos_brasileiros BOOLEAN,
    quantidade_filhos_brasileiros INTEGER,
    
    -- Dados de naturalização
    data_chegada_brasil DATE,
    naturalizado BOOLEAN,
    decreto_naturalizacao VARCHAR(50),
    
    -- Assinatura e rescisão
    assinatura_funcionario TEXT,
    data_rescisao DATE,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (unit_id) REFERENCES units(id)
    -- A foreign key para company_id será adicionada em uma migration posterior (V127+)
        );
    END IF;
END $$;

-- Índices para a tabela employees
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
        CREATE INDEX IF NOT EXISTS idx_employees_position_id ON employees(position_id);
        CREATE INDEX IF NOT EXISTS idx_employees_unit_id ON employees(unit_id);
        CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
        CREATE INDEX IF NOT EXISTS idx_employees_cpf ON employees(cpf);
        CREATE INDEX IF NOT EXISTS idx_employees_rg ON employees(rg);
        CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
        CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
        CREATE INDEX IF NOT EXISTS idx_employees_registration_number ON employees(registration_number);
    END IF;
END $$;

-- Tabela de documentos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        CREATE TABLE documents (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            type VARCHAR(50) NOT NULL,
            number VARCHAR(50) NOT NULL,
            issue_date TIMESTAMP,
            expiration_date TIMESTAMP,
            file_url VARCHAR(255),
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
    END IF;
END $$;

-- Tabela de benefícios
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'benefits') THEN
        CREATE TABLE benefits (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            position_id UUID NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            start_date DATE NOT NULL,
            end_date DATE,
            value DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (position_id) REFERENCES positions(id)
        );
    END IF;
END $$;

-- Tabela de histórico de escalas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scale_histories') THEN
        CREATE TABLE scale_histories (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            scale VARCHAR(50) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
    END IF;
END $$;

-- Tabela de ocorrências
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'occurrences') THEN
        CREATE TABLE occurrences (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            type VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            occurrence_date TIMESTAMP,
            document_url VARCHAR(255),
            status VARCHAR(20),
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
    END IF;
END $$;

-- Tabela de folha de pagamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payrolls') THEN
        CREATE TABLE payrolls (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            unit_id UUID NOT NULL,
            reference_month VARCHAR(7) NOT NULL,
            base_salary DECIMAL(10,2),
            gross_salary DECIMAL(10,2),
            net_salary DECIMAL(10,2),
            overtime_hours DECIMAL(10,2),
            overtime_value DECIMAL(10,2),
            benefits_value DECIMAL(10,2),
            deductions_value DECIMAL(10,2),
            document_url VARCHAR(255),
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (unit_id) REFERENCES units(id)
        );
    END IF;
END $$;

-- Tabela de EPIs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'epis') THEN
        CREATE TABLE epis (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            position_id UUID NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            issue_date TIMESTAMP NOT NULL,
            expiration_date TIMESTAMP,
            return_date TIMESTAMP,
            status VARCHAR(20) NOT NULL,
            document_url VARCHAR(255),
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (position_id) REFERENCES positions(id)
        );
    END IF;
END $$;

-- Tabela de itens da folha de pagamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_items') THEN
        CREATE TABLE payroll_items (
            id UUID PRIMARY KEY,
            payroll_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            description VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            type VARCHAR(20) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (payroll_id) REFERENCES payrolls(id),
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
    END IF;
END $$;

-- Função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar o updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'positions') THEN
        DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
        CREATE TRIGGER update_positions_updated_at
            BEFORE UPDATE ON positions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units') THEN
        DROP TRIGGER IF EXISTS update_units_updated_at ON units;
        CREATE TRIGGER update_units_updated_at
            BEFORE UPDATE ON units
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
        CREATE TRIGGER update_employees_updated_at
            BEFORE UPDATE ON employees
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
        CREATE TRIGGER update_documents_updated_at
            BEFORE UPDATE ON documents
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'benefits') THEN
        DROP TRIGGER IF EXISTS update_benefits_updated_at ON benefits;
        CREATE TRIGGER update_benefits_updated_at
            BEFORE UPDATE ON benefits
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scale_histories') THEN
        DROP TRIGGER IF EXISTS update_scale_histories_updated_at ON scale_histories;
        CREATE TRIGGER update_scale_histories_updated_at
            BEFORE UPDATE ON scale_histories
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'occurrences') THEN
        DROP TRIGGER IF EXISTS update_occurrences_updated_at ON occurrences;
        CREATE TRIGGER update_occurrences_updated_at
            BEFORE UPDATE ON occurrences
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payrolls') THEN
        DROP TRIGGER IF EXISTS update_payrolls_updated_at ON payrolls;
        CREATE TRIGGER update_payrolls_updated_at
            BEFORE UPDATE ON payrolls
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'epis') THEN
        DROP TRIGGER IF EXISTS update_epis_updated_at ON epis;
        CREATE TRIGGER update_epis_updated_at
            BEFORE UPDATE ON epis
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$; 