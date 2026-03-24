-- =====================================================
-- SCRIPT PARA EXPORTAR TODOS OS FUNCIONÁRIOS PARA CI
-- Execute este script no PostgreSQL e copie os INSERTs gerados
-- para o arquivo V999__seed_ci_essential_data.sql
-- =====================================================

-- Gerar INSERTs completos com todos os campos importantes
SELECT 
    'INSERT INTO employees (' ||
    'id, user_id, position_id, registration_number, name, cpf, rg, ' ||
    'birth_date, gender, marital_status, nationality, address, phone, email, ' ||
    'unit_id, company_id, hire_date, termination_date, status, notes, photo_url, ' ||
    'cnh_number, cnh_expiration_date, cnh_category, ' ||
    'ctps, ctps_series, ctps_issue_date, ctps_issuing_agency, ctps_rural, ' ||
    'titulo_eleitor, titulo_eleitor_zona, titulo_eleitor_secao, ' ||
    'carteira_identidade_orgao_emissor, carteira_identidade_data_emissao, certificado_militar, ' ||
    'cbo, pis, salario, salario_por_extenso, periodo_pagamento, horario_trabalho, folga_semanal, ' ||
    'fgts_optante, fgts_data_opcao, fgts_banco_depositario, fgts_data_retratacao, ' ||
    'pis_data_cadastro, pis_banco_depositario, pis_endereco_banco, pis_codigo_banco, pis_codigo_agencia, ' ||
    'visto_fiscalizacao, nome_pai, nome_mae, local_nascimento, grau_instrucao, ' ||
    'carteira_modelo_19, registro_geral_estrangeiro, ' ||
    'casado_brasileiro, nome_conjuge_estrangeiro, ' ||
    'spouse_name, spouse_cpf, spouse_rg, spouse_birth_date, spouse_phone, spouse_email, ' ||
    'tem_filhos_brasileiros, quantidade_filhos_brasileiros, ' ||
    'data_chegada_brasil, naturalizado, decreto_naturalizacao, ' ||
    'assinatura_funcionario, data_rescisao, whatsapp, ' ||
    'banco, agencia, conta_corrente, ' ||
    'created_at, updated_at' ||
    ') VALUES (' ||
    '''' || id || ''', ' ||
    COALESCE('''' || user_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || position_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(registration_number, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(cpf, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(rg, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || birth_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(gender, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(marital_status, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(nationality, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(address, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(phone, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(email, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || unit_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || company_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || hire_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || termination_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(status, '''', '''''') || '''', '''ACTIVE''') || ', ' ||
    COALESCE('''' || REPLACE(notes, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(photo_url, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(cnh_number, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || cnh_expiration_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(cnh_category, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(ctps, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(ctps_series, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || ctps_issue_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(ctps_issuing_agency, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(ctps_rural, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(titulo_eleitor, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(titulo_eleitor_zona, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(titulo_eleitor_secao, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(carteira_identidade_orgao_emissor, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || carteira_identidade_data_emissao::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(certificado_militar, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(cbo, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(pis, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(salario::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(salario_por_extenso, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(periodo_pagamento, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(horario_trabalho, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(folga_semanal, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(fgts_optante::text, 'NULL') || ', ' ||
    COALESCE('''' || fgts_data_opcao::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(fgts_banco_depositario, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || fgts_data_retratacao::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || pis_data_cadastro::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(pis_banco_depositario, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(pis_endereco_banco, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(pis_codigo_banco, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(pis_codigo_agencia, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(visto_fiscalizacao, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(nome_pai, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(nome_mae, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(local_nascimento, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(grau_instrucao, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(carteira_modelo_19, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(registro_geral_estrangeiro, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(casado_brasileiro::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(nome_conjuge_estrangeiro, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(spouse_name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(spouse_cpf, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(spouse_rg, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || spouse_birth_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(spouse_phone, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(spouse_email, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(tem_filhos_brasileiros::text, 'NULL') || ', ' ||
    COALESCE(quantidade_filhos_brasileiros::text, 'NULL') || ', ' ||
    COALESCE('''' || data_chegada_brasil::text || '''', 'NULL') || ', ' ||
    COALESCE(naturalizado::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(decreto_naturalizacao, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(assinatura_funcionario, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || data_rescisao::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(whatsapp, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(banco, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(agencia, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(conta_corrente, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NOW()') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NOW()') ||
    ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM employees
ORDER BY name;














