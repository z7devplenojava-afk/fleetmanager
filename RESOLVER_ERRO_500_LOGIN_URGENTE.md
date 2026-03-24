# 🚨 RESOLVER ERRO 500 LOGIN - URGENTE

## ❌ **Erro Atual**

```
POST http://localhost:8081/api/auth/login 500 (Internal Server Error)
message: 'Erro interno do servidor. Tente novamente mais tarde.'
```

---

## 🔍 **Causa Provável**

O erro 500 significa que **algo está quebrando no backend** durante o login.

**Causas mais comuns:**
1. ❌ Usuário sem roles cadastradas
2. ❌ Usuário com ID null
3. ❌ CustomPermissionService lançando exceção
4. ❌ getRoles() retornando null

---

## 🚀 **SOLUÇÃO RÁPIDA (Execute AGORA)**

### **Passo 1: Execute este SQL**

```bash
cd backend
psql -U postgres -d secured_guard -f DEBUG_LOGIN_ERROR_500.sql
```

Ou execute manualmente:

```sql
-- Verificar e corrigir usuário
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

**Se `total_roles = 0`** → **ESSE É O PROBLEMA!**

---

### **Passo 2: Adicionar Role COLABORADOR**

```sql
-- 1. Garantir que role COLABORADOR existe
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'COLABORADOR', 'Funcionário colaborador', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Associar role ao usuário
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = '05986003616'
  AND r.name = 'COLABORADOR'
ON CONFLICT DO NOTHING;

-- 3. Verificar
SELECT u.username, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = '05986003616';
```

**Resultado esperado:**
```
username      | role
--------------+-----------
05986003616   | COLABORADOR
```

---

### **Passo 3: Verificar Senha**

```sql
SELECT 
    username,
    LEFT(password, 10) as hash,
    LENGTH(password) as tamanho
FROM users
WHERE username = '05986003616';
```

**Resultado esperado:**
```
hash: $2a$10$...
tamanho: ~60
```

**Se estiver diferente** → Senha não está criptografada!

**Corrigir:**
```sql
-- Resetar senha para CPF@2025 (vai precisar criptografar no Java)
-- OU marcar para primeiro acesso
UPDATE users
SET first_access = true
WHERE username = '05986003616';
```

---

## 🔧 **Solução Completa**

### **Script Completo de Correção:**

```sql
BEGIN;

-- 1. Criar role COLABORADOR
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'COLABORADOR', 'Funcionário colaborador', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Associar role a TODOS os usuários colaborador.*@
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br'
  AND r.name = 'COLABORADOR'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- 3. Verificar resultado
SELECT 
    u.username,
    u.email,
    STRING_AGG(r.name, ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br'
GROUP BY u.username, u.email
ORDER BY u.email;

COMMIT;
```

---

## 📋 **Checklist de Debug**

Execute cada query e verifique:

- [ ] Usuário `05986003616` existe? 
- [ ] Tem `id` válido (UUID)?
- [ ] Email correto?
- [ ] `active = true`?
- [ ] `status = 'ACTIVE'`?
- [ ] Senha criptografada ($2a$10$...)?
- [ ] Tem pelo menos 1 role?
- [ ] Role `COLABORADOR` existe na tabela `roles`?

**SE ALGUM ITEM ESTIVER ❌** → Esse é o problema!

---

## 🔍 **Ver Logs do Backend**

Olhe no console onde o backend está rodando. Procure por:

```
ERROR
Exception
NullPointerException
```

**Exemplo de erro comum:**
```
java.lang.NullPointerException: Cannot invoke "java.util.Set.stream()" 
because the return value of "User.getRoles()" is null
```

**Solução:** Usuário sem roles → Execute o script acima

---

## 🚨 **Ação Imediata**

### **Execute AGORA:**

```bash
# 1. Abrir PostgreSQL
psql -U postgres -d secured_guard

# 2. Executar script de correção
\i backend/DEBUG_LOGIN_ERROR_500.sql

# 3. Ou copiar e colar as queries diretamente
```

### **Ou via DBeaver/pgAdmin:**
1. Abrir `DEBUG_LOGIN_ERROR_500.sql`
2. Executar todas as queries
3. Verificar resultado da query final

---

## ✅ **Após Correção**

### **Testar Login:**

```
Usuário: 05986003616
Senha: 05986003616@2025
```

**Resultado esperado:**
```
✅ Login bem-sucedido
✅ Token JWT gerado
✅ Redirecionamento para dashboard
```

---

## 📝 **Resumo**

**Problema:** Erro 500 ao fazer login  
**Causa Provável:** Usuário sem roles cadastradas  
**Solução:** Executar `DEBUG_LOGIN_ERROR_500.sql`  
**Tempo:** ~2 minutos

---

**EXECUTE O SCRIPT SQL AGORA PARA RESOLVER!** 🚨🔧✅

