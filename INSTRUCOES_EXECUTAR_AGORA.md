# 🚨 INSTRUÇÕES URGENTES - RECRIAR TABELA EMPLOYEES

## ❌ Problema Identificado

1. **Tabela `employees` foi deletada** manualmente do banco
2. **Flyway ainda tem registro** da migration V2 como executada
3. **Migration V263 está falhando** porque a tabela não existe
4. **Backend não consegue iniciar** devido aos erros de migration

## ✅ Solução

### PASSO 1: Executar SQL no DBeaver/PgAdmin

Execute o script `LIMPAR_E_RECRIAR_EMPLOYEES.sql` no banco de dados:

```sql
-- 1. Remover o registro da V2 do histórico do Flyway
DELETE FROM flyway_schema_history WHERE version = '2';

-- 2. Remover também a V263 que está falhando
DELETE FROM flyway_schema_history WHERE version = '263';

-- 3. Verificar se a tabela employees existe e deletá-la se existir
DROP TABLE IF EXISTS employees CASCADE;

-- 4. Verificar o estado atual
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
WHERE version IN ('2', '263')
ORDER BY installed_rank DESC;
```

### PASSO 2: Recompilar o Backend

```powershell
.\mvnw.cmd clean package -DskipTests
```

### PASSO 3: Iniciar o Backend

```powershell
java -jar backend/target/secured-guard-1.0.0.jar --spring.profiles.active=test
```

## 📋 O Que Vai Acontecer

1. ✅ Flyway não encontrará o registro da V2
2. ✅ Flyway executará a V2 novamente
3. ✅ A tabela `employees` será criada com **TODAS as 70+ colunas**
4. ✅ Incluindo a coluna `company_id` e seu relacionamento
5. ✅ Todos os índices serão criados
6. ✅ Backend iniciará normalmente

## 🎯 Resultado Esperado

A tabela `employees` será criada com:
- ✅ Todas as colunas do Model Java
- ✅ Coluna `company_id` com foreign key
- ✅ Índices para performance
- ✅ Comentários em todas as colunas

## ⚠️ IMPORTANTE

- A migration V263 foi **removida** (não é mais necessária)
- Tudo está incluído na **V2 atualizada**
- A tabela será criada **completa desde o início**

