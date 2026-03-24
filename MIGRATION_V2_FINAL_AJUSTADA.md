# ✅ MIGRATION V2 FINALIZADA E AJUSTADA

## 📋 Ajustes Realizados

### 1. **Tabela `positions`**
✅ Adicionada coluna `base_salary NUMERIC(10,2)`

### 2. **Tabela `employees`**
✅ Adicionada coluna `company_id UUID` com foreign key para `companies(id)`  
✅ **Removidos campos duplicados**:
- ❌ `empresa_nome` (removido - usar `company.name`)
- ❌ `empresa_endereco` (removido - usar `company.address`)
- ❌ `empresa_cnpj` (removido - usar `company.cnpj`)
- ❌ `visto_fiscalizacao` (removido)

**Justificativa**: Agora usamos o relacionamento `company_id` para acessar os dados da empresa. Isso evita duplicação de dados e garante consistência.

## 📊 Estrutura Final da Tabela `employees`

### Campos Básicos
- `id`, `user_id`, `position_id`, `unit_id`, `company_id`
- `registration_number`, `name`, `document`, `cpf`, `rg`
- `birth_date`, `gender`, `marital_status`, `nationality`
- `address`, `phone`, `email`
- `hire_date`, `termination_date`, `status`, `notes`, `photo_url`

### Documentos Pessoais (15 campos)
- CNH: `cnh_number`, `cnh_expiration_date`, `cnh_category`
- CTPS: `ctps`, `ctps_series`, `ctps_issue_date`, `ctps_issuing_agency`, `ctps_rural`
- Título Eleitor: `titulo_eleitor`, `titulo_eleitor_zona`, `titulo_eleitor_secao`
- RG: `carteira_identidade_orgao_emissor`, `carteira_identidade_data_emissao`
- Militar: `certificado_militar`

### Dados Profissionais (14 campos)
- Ocupação: `cbo`, `pis`
- Salário: `salario`, `salario_por_extenso`
- Jornada: `periodo_pagamento`, `horario_trabalho`, `folga_semanal`
- FGTS: `fgts_optante`, `fgts_data_opcao`, `fgts_banco_depositario`, `fgts_data_retratacao`
- PIS: `pis_data_cadastro`, `pis_banco_depositario`, `pis_endereco_banco`, `pis_codigo_banco`, `pis_codigo_agencia`

### Dados Familiares (13 campos)
- Pais: `nome_pai`, `nome_mae`, `local_nascimento`, `grau_instrucao`
- Cônjuge: `spouse_name`, `spouse_cpf`, `spouse_rg`, `spouse_birth_date`, `spouse_phone`, `spouse_email`
- Filhos: `tem_filhos_brasileiros`, `quantidade_filhos_brasileiros`
- Estrangeiro: `casado_brasileiro`, `nome_conjuge_estrangeiro`

### Dados Especiais (6 campos)
- Documentos: `carteira_modelo_19`, `registro_geral_estrangeiro`
- Naturalização: `data_chegada_brasil`, `naturalizado`, `decreto_naturalizacao`
- Outros: `assinatura_funcionario`, `data_rescisao`

### Foreign Keys
```sql
FOREIGN KEY (user_id) REFERENCES users(id)
FOREIGN KEY (position_id) REFERENCES positions(id)
FOREIGN KEY (unit_id) REFERENCES units(id)
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
```

### Índices
```sql
idx_employees_user_id
idx_employees_position_id
idx_employees_unit_id
idx_employees_company_id  ← NOVO
idx_employees_cpf
idx_employees_rg
idx_employees_email
idx_employees_status
idx_employees_registration_number
```

## 🎯 Benefícios dos Ajustes

### ✅ Normalização de Dados
- Dados da empresa agora centralizados na tabela `companies`
- Evita duplicação e inconsistências
- Facilita atualizações (mudar CNPJ afeta todos os funcionários automaticamente)

### ✅ Performance
- Índice em `company_id` para consultas rápidas
- Consultas como "todos os funcionários da empresa X" são otimizadas

### ✅ Integridade Referencial
- `ON DELETE SET NULL`: Se uma empresa for excluída, os funcionários não são excluídos, apenas o `company_id` fica `NULL`
- Permite rastreamento histórico mesmo se a empresa não existir mais

## 📋 Próximos Passos

**MESMOS DE ANTES** - Execute o script no DBeaver:

```sql
DELETE FROM flyway_schema_history WHERE version IN ('2', '263');

DROP TABLE IF EXISTS payroll_items CASCADE;
DROP TABLE IF EXISTS epis CASCADE;
DROP TABLE IF EXISTS payrolls CASCADE;
DROP TABLE IF EXISTS occurrences CASCADE;
DROP TABLE IF EXISTS scale_histories CASCADE;
DROP TABLE IF EXISTS benefits CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS units CASCADE;

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_benefits_updated_at ON benefits;
DROP TRIGGER IF EXISTS update_scale_histories_updated_at ON scale_histories;
DROP TRIGGER IF EXISTS update_occurrences_updated_at ON occurrences;
DROP TRIGGER IF EXISTS update_payrolls_updated_at ON payrolls;
DROP TRIGGER IF EXISTS update_epis_updated_at ON epis;
DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
DROP TRIGGER IF EXISTS update_units_updated_at ON units;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

Depois reinicie o backend!

## 🎉 Resultado Esperado

- ✅ Tabela `employees` com 70+ colunas relevantes
- ✅ Relacionamento `company_id` funcionando
- ✅ Sem campos duplicados
- ✅ Banco de dados normalizado e otimizado
- ✅ Cadastro de funcionário funcionando perfeitamente!

