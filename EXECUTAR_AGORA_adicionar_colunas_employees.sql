-- EXECUTAR ESTE SCRIPT DIRETAMENTE NO POSTGRESQL
-- Adiciona TODAS as colunas faltantes na tabela employees
-- Data: 2025-10-17

-- Conectar no banco: psql -U postgres -d secured_guard_test -p 5432
-- Executar: \i EXECUTAR_AGORA_adicionar_colunas_employees.sql

\c secured_guard_test

-- Adicionar todas as colunas faltantes
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

-- Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY column_name;

-- Atualizar a versão do Flyway
INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES (
    (SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM flyway_schema_history),
    '262',
    'add missing employee columns',
    'SQL',
    'V262__add_missing_employee_columns.sql',
    NULL,
    'postgres',
    NOW(),
    0,
    TRUE
)
ON CONFLICT DO NOTHING;

-- Mensagem de sucesso
\echo '✅ TODAS AS COLUNAS FORAM ADICIONADAS COM SUCESSO!'
\echo 'Agora reinicie o backend e teste novamente.'

