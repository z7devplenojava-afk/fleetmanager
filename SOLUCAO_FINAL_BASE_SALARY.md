# ✅ SOLUÇÃO FINAL - base_salary CORRIGIDA

## ❌ Problema

**Linha 622**: `ERRO: coluna "base_salary" da relação "positions" já existe`

A migration **V29** tentava adicionar a coluna `base_salary` na tabela `positions`, mas ela **já foi adicionada na V2** quando corrigimos o problema anterior.

## ✅ Solução Implementada

### Migration V29 Atualizada

Mudei de:
```sql
ALTER TABLE positions ADD COLUMN base_salary FLOAT;
```

Para:
```sql
-- Adicionar coluna base_salary se não existir (já foi adicionada na V2)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'positions' AND column_name = 'base_salary'
    ) THEN
        ALTER TABLE positions ADD COLUMN base_salary FLOAT;
    END IF;
END $$;
```

Agora a V29 verifica se a coluna existe antes de tentar adicioná-la.

## 📋 Resumo de Todas as Correções

1. ✅ **V2**: Tabela `employees` completa com todas as colunas + `company_id`
2. ✅ **V2**: Tabela `positions` com coluna `base_salary`
3. ✅ **V2**: Removida foreign key para `companies` (será adicionada na V127)
4. ✅ **V29**: Adicionada verificação `IF NOT EXISTS` para `base_salary`
5. ✅ **V127**: Adiciona foreign key `company_id` após criar tabela `companies`
6. ✅ **Script de limpeza**: Remove registros V2, V29 e V263

## 🚀 Como Aplicar

### Opção 1: Apenas corrigir a V29 (mais rápido)

Se você **NÃO executou** o script de limpeza ainda, basta:

1. Parar o backend
2. Limpar apenas a V29 do Flyway:
   ```sql
   DELETE FROM flyway_schema_history WHERE version = '29';
   ```
3. Reiniciar o backend

### Opção 2: Limpar tudo e recomeçar (mais seguro)

Execute o script completo `LIMPAR_E_RECRIAR_COMPLETO.sql` no DBeaver e reinicie o backend.

## 🎯 Resultado Esperado

Após reiniciar o backend:
- ✅ Migration V2 executará normalmente
- ✅ Migration V29 verificará que `base_salary` já existe e não fará nada
- ✅ Migration V127 criará a tabela `companies` e adicionará a foreign key
- ✅ Backend iniciará com sucesso
- ✅ Cadastro de funcionários funcionará perfeitamente!

## 📝 Arquivos Modificados

1. `backend/src/main/resources/db/migration/V2__create_hr_tables.sql`
   - Adicionada coluna `base_salary` em `positions`
   - Adicionada coluna `company_id` em `employees`
   - Removida foreign key para `companies`

2. `backend/src/main/resources/db/migration/V29__add_base_salary_to_positions.sql`
   - Adicionada verificação `IF NOT EXISTS`

3. `backend/src/main/resources/db/migration/V127__create_companies_table.sql`
   - Adicionada lógica para criar foreign key `company_id`

4. `LIMPAR_E_RECRIAR_COMPLETO.sql`
   - Atualizado para remover registros V2, V29 e V263

