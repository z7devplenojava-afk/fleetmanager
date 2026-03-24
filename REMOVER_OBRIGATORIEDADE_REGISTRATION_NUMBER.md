# 🔧 Remover Obrigatoriedade do Número de Registro do Funcionário

## 🎯 **Objetivo:**

Tornar o campo `registration_number` (Número de Registro/Matrícula) **opcional**, pois será preenchido pela contabilidade posteriormente.

## 📊 **Situação Atual:**

### **Backend:**
- ✅ **Model (Employee.java)**: Campo já é opcional (sem `@NotNull`)
- ❌ **Database (V2_migration)**: Campo definido como `NOT NULL`

### **Frontend:**
- ✅ **Formulário**: Campo já é opcional (sem validação `required`)
- ✅ **Type**: Campo já é opcional

## ✅ **Correção Implementada:**

### **Migration V277**

Criado arquivo: `backend/src/main/resources/db/migration/V277__make_registration_number_optional.sql`

```sql
-- Tornar registration_number opcional
ALTER TABLE employees 
ALTER COLUMN registration_number DROP NOT NULL;

-- Adicionar comentário
COMMENT ON COLUMN employees.registration_number IS 
  'Número de registro do funcionário (opcional) - Preenchido pela contabilidade';
```

## 🚀 **Como Aplicar:**

### **Ambiente Local:**

**1. Reinicie o backend** (Flyway aplicará automaticamente):
```bash
cd backend
./mvnw spring-boot:run
```

**2. Ou execute manualmente no DBeaver/pgAdmin:**
```sql
ALTER TABLE employees 
ALTER COLUMN registration_number DROP NOT NULL;
```

### **Ambiente CI (Automático):**

```bash
git add .
git commit -m "feat: Tornar registration_number opcional

- Remove obrigatoriedade de registration_number no banco
- Campo sera preenchido pela contabilidade posteriormente
- Migration V277 aplicada
- Nao afeta frontend (ja era opcional)"

git push origin ci
```

O Flyway aplicará automaticamente no próximo deploy.

## 📋 **Validação:**

Após aplicar a migration:

### **1. Verificar no Banco:**
```sql
-- Ver estrutura da coluna
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'employees' 
AND column_name = 'registration_number';
```

**Resultado esperado:**
```
registration_number | YES | character varying
```

### **2. Testar Cadastro:**

**Criar funcionário SEM registration_number:**

```json
POST /api/employees
{
  "name": "TESTE SEM MATRICULA",
  "cpf": "123.456.789-00",
  "status": "ACTIVE",
  "address": {
    "street": "Rua Teste"
  }
}
```

Deve retornar **200 OK** ✅

## 📊 **Impacto:**

### **✅ Antes:**
- ❌ `registration_number` obrigatório no banco
- ❌ Erro ao tentar cadastrar sem matrícula
- ❌ Precisa preencher mesmo que não saiba

### **✅ Depois:**
- ✅ `registration_number` opcional
- ✅ Pode cadastrar sem matrícula
- ✅ Contabilidade preenche depois
- ✅ Campo pode ser null no banco

## 🎯 **Próximos Passos:**

1. **Reinicie o backend local** (Flyway aplica V277)
2. **Teste cadastro** sem registration_number
3. **Faça commit e push** para CI
4. **Valide** em todos os ambientes

## ⏱️ **Timeline:**

- **Reiniciar backend**: 30 segundos
- **Testar localmente**: 2 minutos
- **Commit + Push**: 1 minuto
- **Deploy CI**: 5-10 minutos
- **Total**: ~15 minutos

---

## 🚨 **NOTA IMPORTANTE:**

Funcionários **já cadastrados** com `registration_number` continuarão com seus números.

Novos funcionários podem ser cadastrados **sem** `registration_number`, que poderá ser adicionado depois pela contabilidade.

**REINICIE O BACKEND PARA APLICAR A MIGRATION!** 🚀
