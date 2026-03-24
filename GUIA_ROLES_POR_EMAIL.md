# 📧 Guia de Atribuição Automática de ROLES por Email

## 🎯 Regra de Negócio Implementada

**TODOS os usuários com email no padrão específico recebem automaticamente o ROLE correspondente.**

---

## 📋 Padrões de Email e ROLES

### **1. COLABORADOR** 👥
**Padrão:** `colaborador.*@promovervigilancia.com.br`

**Exemplos:**
- ✅ `colaborador.05986003616@promovervigilancia.com.br`
- ✅ `colaborador.12345678901@promovervigilancia.com.br`
- ✅ `colaborador.joao.silva@promovervigilancia.com.br`

**Role Atribuído:** `COLABORADOR`

**Funcionalidades:**
- Dashboard pessoal
- Visualizar próprios holerites
- Visualizar próprias férias
- Mensagens internas

---

### **2. ADMIN** 🔑
**Padrão:** `admin.*@promovervigilancia.com.br`

**Exemplos:**
- ✅ `admin.sistemas@promovervigilancia.com.br`
- ✅ `admin.ti@promovervigilancia.com.br`

**Role Atribuído:** `ADMIN`

---

### **3. RH** 👔
**Padrão:** `rh.*@promovervigilancia.com.br`

**Exemplos:**
- ✅ `rh.departamento@promovervigilancia.com.br`
- ✅ `rh.pessoal@promovervigilancia.com.br`

**Role Atribuído:** `RH`

---

### **4. FINANCEIRO** 💰
**Padrão:** `financeiro.*@promovervigilancia.com.br`

**Exemplos:**
- ✅ `financeiro.contabilidade@promovervigilancia.com.br`
- ✅ `financeiro.tesouraria@promovervigilancia.com.br`

**Role Atribuído:** `FINANCEIRO`

---

### **5. SUPERVISOR** 👨‍💼
**Padrão:** `supervisor.*@promovervigilancia.com.br`

**Exemplos:**
- ✅ `supervisor.plantao@promovervigilancia.com.br`
- ✅ `supervisor.operacoes@promovervigilancia.com.br`

**Role Atribuído:** `SUPERVISOR`

---

## 🔧 Como Funciona

### **1. Registro de Novo Usuário**

```java
// No AuthenticationServiceImpl.java

// Verifica padrão de email
boolean isColaboradorEmail = email.matches("colaborador\\..*@promovervigilancia\\.com\\.br");

if (isColaboradorEmail) {
    // Atribui ROLE COLABORADOR automaticamente
    userRoles = Set.of(colaboradorRole);
}
```

### **2. Importação de Holerites**

```java
// No PayslipService.java

// Email gerado: colaborador.CPF@promovervigilancia.com.br
String email = "colaborador." + cpf + "@promovervigilancia.com.br";

// Role COLABORADOR atribuído automaticamente
```

### **3. Utilitário de Validação**

```java
// RoleAssignmentUtil.java

public static String determineDefaultRole(String email) {
    if (email.matches("colaborador\\..*@promovervigilancia\\.com\\.br")) {
        return "COLABORADOR";
    }
    // ... outros padrões
}
```

---

## 🚀 Aplicando a Regra em Usuários Existentes

### **Opção 1: Script SQL Automático**

Execute o script:
```bash
cd backend
psql -U postgres -d secured_guard -f ATUALIZAR_ROLES_COLABORADORES.sql
```

### **Opção 2: Migration Flyway**

A migration `V304` será executada automaticamente ao reiniciar o backend:

```sql
-- V304__assign_colaborador_role_by_email_pattern.sql

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
```

### **Opção 3: SQL Manual**

```sql
-- 1. Garantir que role existe
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'COLABORADOR', 'Colaborador', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Atribuir role para emails colaborador.*
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br'
  AND r.name = 'COLABORADOR'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- 3. Verificar
SELECT u.email, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br';
```

---

## 🔍 Verificar Usuários Afetados

```sql
-- Listar todos os colaboradores
SELECT 
    u.username,
    u.name,
    u.email,
    r.name as role,
    u.status,
    u.active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br'
ORDER BY u.email;

-- Contar colaboradores
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(DISTINCT CASE WHEN r.name = 'COLABORADOR' THEN u.id END) as com_role_colaborador
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br';
```

---

## ✅ Testes

### **1. Criar Usuário com Email Colaborador**

```bash
POST /api/auth/register
{
  "username": "05986003616",
  "email": "colaborador.05986003616@promovervigilancia.com.br",
  "fullName": "João Silva",
  "password": "05986003616@2025"
}
```

**Resultado Esperado:**
- ✅ Usuário criado
- ✅ ROLE `COLABORADOR` atribuído automaticamente
- ✅ Ignorar qualquer role solicitado no request

### **2. Importar Holerite**

```bash
POST /api/payslips/upload
# Arquivo PDF com dados do colaborador
```

**Resultado Esperado:**
- ✅ Usuário criado com email `colaborador.CPF@promovervigilancia.com.br`
- ✅ ROLE `COLABORADOR` atribuído automaticamente

---

## 📊 Logs do Sistema

Ao criar usuário com email colaborador, você verá nos logs:

```
📧 Email identificado como colaborador: colaborador.05986003616@promovervigilancia.com.br
   - atribuindo ROLE COLABORADOR automaticamente
👥 Role COLABORADOR atribuído (email: colaborador.05986003616@promovervigilancia.com.br)
✅ Usuário criado com sucesso
```

---

## 🔒 Segurança

### **Regras Aplicadas:**

1. ✅ Email `colaborador.*@promovervigilancia.com.br` → **SEMPRE COLABORADOR**
2. ✅ Não é possível sobrescrever o role via API
3. ✅ Apenas SUPER_ADMIN pode alterar manualmente no banco
4. ✅ Migration garante consistência em usuários existentes

---

## 🛠️ Manutenção

### **Adicionar Novo Padrão de Email:**

Edite `RoleAssignmentUtil.java`:

```java
if (email.matches("gerente\\..*@promovervigilancia\\.com\\.br")) {
    log.info("✅ Email identificado como GERENTE: {}", email);
    return "GERENTE";
}
```

### **Remover Padrão:**

Comente ou remova a validação correspondente.

---

## 📝 Resumo

| Email Pattern | Role Atribuído | Funcionalidades |
|--------------|----------------|-----------------|
| `colaborador.*@promovervigilancia.com.br` | COLABORADOR | Dashboard, Holerites, Férias |
| `admin.*@promovervigilancia.com.br` | ADMIN | Gestão completa |
| `rh.*@promovervigilancia.com.br` | RH | Gestão de funcionários |
| `financeiro.*@promovervigilancia.com.br` | FINANCEIRO | Gestão financeira |
| `supervisor.*@promovervigilancia.com.br` | SUPERVISOR | Operacional |

---

**REGRA IMPLEMENTADA E DOCUMENTADA!** ✅📧👥

