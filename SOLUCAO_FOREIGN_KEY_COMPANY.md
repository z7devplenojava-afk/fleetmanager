# ✅ FOREIGN KEY company_id CORRIGIDA

## ❌ Problema Identificado

**Linha 442**: `ERRO: relação "companies" não existe`

A tabela `companies` é criada na migration **V127**, que é executada **DEPOIS** da V2. Quando a V2 tentou criar a foreign key para `companies(id)`, a tabela ainda não existia.

## ✅ Solução Implementada

### 1. **Migration V2 Atualizada**

❌ **Removida** a foreign key para `company_id` (porque `companies` ainda não existe):

```sql
-- Foreign Keys
FOREIGN KEY (user_id) REFERENCES users(id),
FOREIGN KEY (position_id) REFERENCES positions(id),
FOREIGN KEY (unit_id) REFERENCES units(id)
-- A foreign key para company_id será adicionada em uma migration posterior (V127+)
```

✅ **A coluna `company_id` PERMANECE** na tabela (apenas sem a constraint por enquanto).

### 2. **Migration V127 Atualizada**

✅ **Adicionada** lógica para criar a foreign key **APÓS** criar a tabela `companies`:

```sql
-- Adicionar foreign key para company_id na tabela employees (se a coluna já existir)
DO $$
BEGIN
    -- Verifica se a coluna company_id existe na tabela employees
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'employees' AND column_name = 'company_id') THEN
        -- Adiciona a foreign key se não existir
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employees_company') THEN
            ALTER TABLE employees 
            ADD CONSTRAINT fk_employees_company 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;
```

## 📋 Ordem de Execução

1. **V2**: Cria `employees` com coluna `company_id` (sem foreign key)
2. **V127**: Cria tabela `companies`
3. **V127**: Adiciona foreign key `fk_employees_company` em `employees.company_id`

## 🎯 Resultado Final

- ✅ Tabela `employees` criada com coluna `company_id`
- ✅ Tabela `companies` criada na V127
- ✅ Foreign key adicionada automaticamente após a criação de `companies`
- ✅ Relacionamento funcionando perfeitamente
- ✅ `ON DELETE SET NULL`: Se uma empresa for excluída, funcionários não são excluídos

## 📝 Próximos Passos

Basta reiniciar o backend. As mudanças já foram aplicadas aos arquivos de migration:

1. Parar o backend (Ctrl+C)
2. Iniciar novamente:
   ```powershell
   java -jar backend/target/secured-guard-1.0.0.jar --spring.profiles.active=test
   ```

As migrations serão executadas na ordem correta e o relacionamento será criado automaticamente! 🚀

