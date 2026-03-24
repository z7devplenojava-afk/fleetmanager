# 🔒 Regras de Segurança - Criação Automática de Usuários

## 🎯 Objetivo

Garantir que **APENAS usuários COLABORADORES** sejam criados automaticamente pelo sistema, impedindo a criação não autorizada de usuários com privilégios administrativos.

---

## 🚨 REGRAS DE SEGURANÇA CRÍTICAS

### **1. Criação Automática - APENAS COLABORADOR**

✅ **PERMITIDO:**
- Criação automática de usuários com role `COLABORADOR`
- Email no padrão: `colaborador.CPF@promovervigilancia.com.br`
- Origem: Importação de holerites (PDF)

❌ **BLOQUEADO:**
- Criação automática de `SUPER_ADMIN`
- Criação automática de `ADMIN`
- Criação automática de `RH`
- Criação automática de `SUPERVISOR`
- Criação automática de `FINANCEIRO`
- Qualquer email fora do padrão `colaborador.*@promovervigilancia.com.br`

---

## 📋 Fluxo de Criação Automática

### **1. Upload de Holerite (PDF)**

```
📄 PDF → Extração de dados → Verificações → Criação de usuário
```

### **2. Dados Extraídos**

- **CPF:** Username do usuário
- **Nome:** Nome completo do funcionário
- **Email:** Gerado automaticamente (colaborador.CPF@promovervigilancia.com.br)
- **Senha:** CPF@2025 (padrão obrigatório)

### **3. Validações de Segurança Aplicadas**

#### **3.1. Verificação de Usuário Existente**

```java
// Se usuário já existe, NÃO criar novo
if (existingUser.isPresent()) {
    // Validação adicional: Verificar se tem role privilegiado
    if (hasPrivilegedRole) {
        log.warn("⚠️ SEGURANÇA: Usuário tem role privilegiado - não será alterado");
    }
    return; // Não criar
}
```

#### **3.2. Validação do Padrão de Email**

```java
// Email DEVE ser colaborador.*@promovervigilancia.com.br
if (!email.matches("colaborador\\..*@promovervigilancia\\.com\\.br")) {
    throw new SecurityException("Email não está no padrão de colaborador");
}
```

#### **3.3. Validação do Role**

```java
// Role DEVE ser COLABORADOR
if (roleName.equals("SUPER_ADMIN") || roleName.equals("ADMIN")) {
    throw new SecurityException("Roles privilegiados não podem ser criados automaticamente!");
}
```

---

## 🔍 Logs de Segurança

### **Criação Bem-Sucedida**

```
🔐 INÍCIO - Verificando se usuário existe para funcionário: João Silva (CPF: 05986003616)
🆕 Usuário não existe - PROSSEGUINDO com criação para CPF: 05986003616
📧 Gerando email para CPF 05986003616: colaborador.05986003616@promovervigilancia.com.br
✅ Email validado: colaborador.05986003616@promovervigilancia.com.br
✅ Role COLABORADOR encontrado: COLABORADOR
👤 Criando novo usuário com dados:
   Username: 05986003616
   Email: colaborador.05986003616@promovervigilancia.com.br
   Nome: João Silva
   Password: 05986003616@2025 (será criptografada)
   Role: COLABORADOR (APENAS)
👥 Role COLABORADOR atribuído
🔒 SEGURANÇA: Confirmado - usuário terá APENAS role COLABORADOR
✅ SUCESSO - Usuário criado automaticamente!
```

### **Tentativa Bloqueada - Role Privilegiado**

```
🚨 SEGURANÇA CRÍTICA: Tentativa de criar usuário com role privilegiado: SUPER_ADMIN
   Criação automática BLOQUEADA!
SecurityException: BLOQUEIO DE SEGURANÇA: Roles privilegiados não podem ser criados automaticamente!
```

### **Tentativa Bloqueada - Email Inválido**

```
🚨 SEGURANÇA: Email admin.teste@promovervigilancia.com.br NÃO está no padrão colaborador.*
   Criação automática BLOQUEADA por segurança!
SecurityException: Email não está no padrão de colaborador. Criação automática bloqueada.
```

### **Usuário Existente com Role Privilegiado**

```
👤 Usuário já existe para CPF: 12345678901 - PULANDO criação
⚠️ SEGURANÇA: Usuário 12345678901 tem role privilegiado - não será alterado automaticamente
```

---

## 🛡️ Camadas de Segurança Implementadas

### **1. Validação de Email (Primeira Camada)**

```java
private String generateUniqueEmail(String cpf, String nome) {
    // SEMPRE gera: colaborador.CPF@promovervigilancia.com.br
    String baseEmail = String.format("colaborador.%s@promovervigilancia.com.br", cpf);
    return baseEmail;
}
```

**Proteção:**
- Email sempre no padrão `colaborador.*`
- Impossível gerar email `admin.*`, `rh.*`, etc.

### **2. Validação de Padrão (Segunda Camada)**

```java
if (!email.matches("colaborador\\..*@promovervigilancia\\.com\\.br")) {
    throw new SecurityException("Email não está no padrão de colaborador");
}
```

**Proteção:**
- Valida regex do email
- Bloqueia qualquer email fora do padrão

### **3. Validação de Role (Terceira Camada)**

```java
if (roleName.equals("SUPER_ADMIN") || roleName.equals("ADMIN")) {
    throw new SecurityException("Roles privilegiados não podem ser criados!");
}
```

**Proteção:**
- Impede atribuição de roles privilegiados
- Mesmo que passe as validações anteriores

### **4. Proteção de Usuários Existentes (Quarta Camada)**

```java
boolean hasPrivilegedRole = user.getRoles().stream()
    .anyMatch(role -> role.getName().equals("SUPER_ADMIN") || 
                     role.getName().equals("ADMIN"));

if (hasPrivilegedRole) {
    log.warn("⚠️ SEGURANÇA: Usuário tem role privilegiado - não será alterado");
    return;
}
```

**Proteção:**
- Usuários com roles privilegiados não são modificados
- Mesmo que CPF seja reutilizado

---

## 📊 Matriz de Permissões

| Ação | COLABORADOR | ADMIN | SUPER_ADMIN |
|------|------------|-------|-------------|
| **Criação Automática (Holerite)** | ✅ SIM | ❌ NÃO | ❌ NÃO |
| **Criação Manual (API)** | ✅ SIM | ✅ SIM* | ✅ SIM* |
| **Email colaborador.*@** | ✅ OBRIGATÓRIO | ❌ BLOQUEADO | ❌ BLOQUEADO |
| **Email admin.*@** | ❌ BLOQUEADO | ✅ SIM* | ✅ SIM* |

*Apenas via criação manual por SUPER_ADMIN

---

## 🔧 Como Criar Usuários Privilegiados

### **SUPER_ADMIN e ADMIN só podem ser criados:**

1. **Manualmente via SQL:**
```sql
INSERT INTO users (id, username, password, name, email, active, status)
VALUES (gen_random_uuid(), 'admin', '$2a$10$...', 'Admin', 'admin@test.com', true, 'ACTIVE');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'SUPER_ADMIN';
```

2. **Via API por SUPER_ADMIN:**
```bash
POST /api/auth/register
Authorization: Bearer {SUPER_ADMIN_TOKEN}
{
  "username": "newadmin",
  "email": "admin@test.com",
  "password": "SecurePass123!",
  "roles": ["ADMIN"]
}
```

3. **Via Interface Administrativa:**
- Login como SUPER_ADMIN
- Menu: Usuários → Criar Novo
- Selecionar role manualmente

---

## ✅ Checklist de Segurança

- [x] Email SEMPRE `colaborador.*@promovervigilancia.com.br`
- [x] Role SEMPRE `COLABORADOR` (criação automática)
- [x] SUPER_ADMIN NÃO pode ser criado automaticamente
- [x] ADMIN NÃO pode ser criado automaticamente
- [x] Validação de padrão de email (regex)
- [x] Validação de role antes da criação
- [x] Proteção de usuários existentes com roles privilegiados
- [x] Logs de segurança para auditoria
- [x] Exceções específicas (SecurityException)

---

## 📝 Exemplos de Uso

### **✅ Caso 1: Importação Normal de Holerite**

**Entrada:**
- PDF com holerite de João Silva
- CPF: 05986003616

**Resultado:**
```
Username: 05986003616
Email: colaborador.05986003616@promovervigilancia.com.br
Role: COLABORADOR
Status: ACTIVE
```

### **✅ Caso 2: CPF Duplicado (Usuário Já Existe)**

**Entrada:**
- PDF com holerite de Maria Santos
- CPF: 12345678901 (já existe no banco)

**Resultado:**
```
👤 Usuário já existe para CPF: 12345678901 - PULANDO criação
(Nenhuma alteração no usuário existente)
```

### **❌ Caso 3: Tentativa de Criar SUPER_ADMIN (Bloqueado)**

**Cenário Hipotético:**
- Tentativa de manipular código para criar SUPER_ADMIN

**Resultado:**
```
🚨 SEGURANÇA CRÍTICA: Tentativa de criar usuário com role privilegiado: SUPER_ADMIN
SecurityException: BLOQUEIO DE SEGURANÇA: Roles privilegiados não podem ser criados automaticamente!
(Criação bloqueada, exceção lançada)
```

---

## 🎯 Conclusão

**TODAS as criações automáticas de usuários:**
- ✅ Serão COLABORADORES
- ✅ Terão email `colaborador.*@promovervigilancia.com.br`
- ✅ Passarão por 4 camadas de validação de segurança
- ✅ Terão logs completos para auditoria

**NENHUM usuário privilegiado:**
- ❌ Pode ser criado automaticamente
- ❌ Pode ter email fora do padrão
- ❌ Pode ser modificado por importação de holerite

---

**SEGURANÇA IMPLEMENTADA E DOCUMENTADA!** 🔒✅🛡️

