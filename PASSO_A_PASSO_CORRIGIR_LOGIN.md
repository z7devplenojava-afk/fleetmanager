# 🔧 Passo a Passo - Corrigir Erro 500 Login

## 📋 **Instruções Simples**

### **1. Abrir DBeaver ou pgAdmin**

- Conectar no banco: `secured_guard`
- Usuário: `postgres`
- Senha: (sua senha do PostgreSQL)

---

### **2. Abrir Nova Query**

No DBeaver:
- Botão direito no banco `secured_guard`
- **SQL Editor** → **New SQL Script**

No pgAdmin:
- Clicar no banco `secured_guard`
- **Tools** → **Query Tool**

---

### **3. Copiar e Colar Esta Query:**

```sql
-- PASSO 1: Verificar usuário
SELECT 
    u.username,
    u.email,
    STRING_AGG(r.name, ', ') as roles,
    COUNT(r.id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = '05986003616'
GROUP BY u.username, u.email;
```

---

### **4. Executar (Ctrl+Enter ou F5)**

**Olhe o resultado:**

✅ **SE `total_roles = 1`** ou mais:
- O problema NÃO é falta de roles
- Veja os logs do backend no console

❌ **SE `total_roles = 0`** ou NULL:
- **ESSE É O PROBLEMA!**
- Continue para o passo 5

---

### **5. SE NÃO TIVER ROLES, Executar:**

```sql
-- CORRIGIR: Adicionar role COLABORADOR
BEGIN;

INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'COLABORADOR', 'Funcionário', NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = '05986003616'
  AND r.name = 'COLABORADOR';

COMMIT;
```

---

### **6. Verificar se corrigiu:**

```sql
SELECT u.username, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = '05986003616';
```

**Resultado esperado:**
```
username: 05986003616
role: COLABORADOR
```

---

### **7. Testar Login:**

Voltar para o navegador e tentar fazer login:

```
Usuário: 05986003616
Senha: 05986003616@2025
```

**Resultado esperado:**
```
✅ Login bem-sucedido!
```

---

## 🔍 **Se AINDA der erro 500:**

### **Olhe o console do backend** (onde está rodando o `mvnw spring-boot:run`)

Procure por:
```
ERROR
Exception
at com.z7design...
```

**Copie o erro e me mostre!**

---

## 📝 **Arquivos Criados para Ajudar:**

1. `COPIAR_E_COLAR_NO_DBEAVER.sql` ← **USE ESTE!**
2. `DEBUG_LOGIN_ERROR_500.sql`
3. `EXECUTAR_MANUALMENTE.txt`
4. `RESOLVER_ERRO_500_LOGIN_URGENTE.md`

---

## ✅ **Resumo:**

1. Abrir DBeaver/pgAdmin
2. Conectar em `secured_guard`
3. Abrir `COPIAR_E_COLAR_NO_DBEAVER.sql`
4. Executar TODAS as queries
5. Testar login novamente

---

**EXECUTE AGORA E O LOGIN VAI FUNCIONAR!** ✅🔧

