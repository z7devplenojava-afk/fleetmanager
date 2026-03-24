# 🚨 EXECUTE NO DBEAVER AGORA - Corrigir Login jose.ramos

## 📋 **Passo a Passo:**

### **1. Abrir DBeaver**
- Conectar em `secured_guard` (porta 5432)

---

### **2. Copiar e Colar Query 1 (Verificar):**

```sql
SELECT 
    u.username,
    u.email,
    STRING_AGG(r.name, ', ') as roles,
    COUNT(r.id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'jose.ramos'
GROUP BY u.username, u.email;
```

**Executar (Ctrl+Enter)**

---

### **3. Olhar o Resultado:**

#### **Caso A: Nenhum registro encontrado** ❌
→ Usuário NÃO existe! Vá para **Query 2A** (criar usuário)

#### **Caso B: Usuário existe, mas `total_roles = 0`** ❌
→ Usuário existe MAS sem roles! Vá para **Query 2B** (adicionar role)

#### **Caso C: Usuário existe com `total_roles >= 1`** ✅
→ Usuário tem roles! O problema é outro (senha incorreta ou não criptografada)

---

### **4A. Se NÃO EXISTE (Query 2A - Criar):**

```sql
BEGIN;

-- Criar role SUPER_ADMIN
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador', NOW())
ON CONFLICT (name) DO NOTHING;

-- Criar usuário jose.ramos
INSERT INTO users (
    id, username, password, name, email, 
    active, status, first_access, two_factor_enabled, 
    created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'jose.ramos',
    '$2a$10$placeholder', -- ⚠️ Senha placeholder - vai precisar resetar
    'Jose Mario Ramos',
    'jose.ramos@promovervigilancia.com.br',
    true, 'ACTIVE', true, false, NOW(), NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Adicionar role SUPER_ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'jose.ramos' AND r.name = 'SUPER_ADMIN';

COMMIT;
```

**⚠️ IMPORTANTE:** Como a senha é placeholder, você precisará fazer **primeiro acesso** ou **recuperar senha**!

---

### **4B. Se EXISTE mas SEM ROLES (Query 2B - Adicionar Role):**

```sql
BEGIN;

-- Criar role SUPER_ADMIN
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador', NOW())
ON CONFLICT (name) DO NOTHING;

-- Adicionar role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'jose.ramos' AND r.name = 'SUPER_ADMIN';

COMMIT;
```

---

### **5. Verificar (Query 3):**

```sql
SELECT u.username, u.email, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'jose.ramos';
```

**Resultado esperado:**
```
username: jose.ramos
email: jose.ramos@promovervigilancia.com.br
role: SUPER_ADMIN
```

---

### **6. Testar Login:**

No navegador:
```
Usuário: jose.ramos
Senha: Admin1234
```

**Se der erro "Bad credentials"** → Senha incorreta ou não criptografada

**Solução rápida:**
1. Use "Esqueci minha senha" na tela de login
2. OU marque `first_access = true`:

```sql
UPDATE users SET first_access = true WHERE username = 'jose.ramos';
```

---

## ✅ **Resumo:**

1. ✅ Abrir DBeaver
2. ✅ Executar Query 1 (verificar)
3. ✅ Executar Query 2A ou 2B (corrigir)
4. ✅ Executar Query 3 (verificar resultado)
5. ✅ Testar login

---

**EXECUTE E O LOGIN VAI FUNCIONAR!** ✅🔧

