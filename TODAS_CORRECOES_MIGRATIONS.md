# ✅ TODAS AS MIGRATIONS CORRIGIDAS

## 🎯 Problema Geral

Várias migrations tentam adicionar colunas que **já foram incluídas na V2 atualizada**. Isso causa erros de "coluna já existe".

## ✅ Migrations Corrigidas

### 1. **V29__add_base_salary_to_positions.sql**
❌ **Antes**: `ALTER TABLE positions ADD COLUMN base_salary FLOAT;`  
✅ **Depois**: Adicionada verificação `IF NOT EXISTS`

### 2. **V139__add_admission_fields_to_employees.sql**
❌ **Antes**: `ADD COLUMN titulo_eleitor VARCHAR(30)` (e outras sem verificação)  
✅ **Depois**: Todas com `ADD COLUMN IF NOT EXISTS`

### 3. **V257__add_assinatura_funcionario_to_employees.sql**
✅ **Já estava correta** com `IF NOT EXISTS`

### 4. **V261__add_titulo_eleitor_to_employees.sql**
✅ **Já estava correta** com `IF NOT EXISTS`

### 5. **V262__add_missing_employee_columns.sql**
✅ **Já estava correta** com `IF NOT EXISTS`

## 📋 Colunas que Já Existem na V2

Todas essas colunas **JÁ ESTÃO** na tabela `employees` criada pela V2:

**Documentos Pessoais:**
- `cnh_number`, `cnh_category`, `cnh_expiration_date`
- `ctps`, `ctps_series`, `ctps_issue_date`, `ctps_issuing_agency`, `ctps_rural`
- `titulo_eleitor`, `titulo_eleitor_zona`, `titulo_eleitor_secao`
- `carteira_identidade_orgao_emissor`, `carteira_identidade_data_emissao`
- `certificado_militar`

**Dados Profissionais:**
- `cbo`, `pis`, `salario`, `salario_por_extenso`
- `periodo_pagamento`, `horario_trabalho`, `folga_semanal`
- `fgts_optante`, `fgts_data_opcao`, `fgts_banco_depositario`, `fgts_data_retratacao`
- `pis_data_cadastro`, `pis_banco_depositario`, `pis_endereco_banco`, `pis_codigo_banco`, `pis_codigo_agencia`

**Dados Familiares:**
- `nome_pai`, `nome_mae`, `local_nascimento`, `grau_instrucao`
- `spouse_name`, `spouse_cpf`, `spouse_rg`, `spouse_birth_date`, `spouse_phone`, `spouse_email`
- `casado_brasileiro`, `nome_conjuge_estrangeiro`
- `tem_filhos_brasileiros`, `quantidade_filhos_brasileiros`

**Outros:**
- `gender`, `rg`, `visto_fiscalizacao`
- `carteira_modelo_19`, `registro_geral_estrangeiro`
- `data_chegada_brasil`, `naturalizado`, `decreto_naturalizacao`
- `assinatura_funcionario`, `data_rescisao`
- `company_id`

## 🚀 Script de Limpeza Atualizado

O script `LIMPAR_E_RECRIAR_COMPLETO.sql` foi atualizado para remover as migrations:
- V2, V29, V139, V261, V262, V263

```sql
DELETE FROM flyway_schema_history WHERE version IN ('2', '29', '139', '261', '262', '263');
```

## 📝 Resultado Esperado

Após executar o script de limpeza e reiniciar o backend:

1. ✅ **V2** será executada e criará a tabela `employees` COMPLETA
2. ✅ **V29** verificará que `base_salary` já existe e não fará nada
3. ✅ **V139** verificará que as colunas já existem e não fará nada
4. ✅ **V257** verificará que as colunas já existem e não fará nada
5. ✅ **V261** verificará que `titulo_eleitor` já existe e não fará nada
6. ✅ **V262** verificará que as colunas já existem e não fará nada
7. ✅ **V127** criará a tabela `companies` e adicionará a foreign key
8. ✅ **Backend iniciará com sucesso!**

## 🎯 Execute Agora

No DBeaver/PgAdmin, execute o script `LIMPAR_E_RECRIAR_COMPLETO.sql` completo e reinicie o backend.

Todas as migrations estão agora **idempotentes** (podem ser executadas múltiplas vezes sem erro)! 🎉

