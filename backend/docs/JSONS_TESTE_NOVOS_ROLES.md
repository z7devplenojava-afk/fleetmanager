# JSONs de Teste para Novos Roles

## 🔐 Estrutura de Roles Atualizada

### 🟥 SUPER_ADMIN - Acesso total e irrestrito
### 🟦 ADMIN - Acesso amplo, subordinado ao Super Admin  
### 🟩 SUPERVISOR - Coordena operações de equipes
### 🟨 RH - Gerencia informações contratuais e pessoais
### 🟧 FINANCEIRO - Controla relatórios financeiros
### 🟪 TI_SUPORTE - Gerencia configuração técnica
### 🟫 AUDITOR - Acesso somente leitura
### 🟨 COLABORADOR - Acesso limitado ao próprio perfil

---

## 📝 Dados de Usuários para Teste

### 1. Super Admin
```json
{
  "name": "Super Admin Teste",
  "email": "superadmin@teste.com",
  "username": "superadmin",
  "password": "123456",
  "role": "SUPER_ADMIN",
  "active": true
}
```

### 2. Admin
```json
{
  "name": "Admin Teste",
  "email": "admin@teste.com",
  "username": "admin",
  "password": "123456",
  "role": "ADMIN",
  "active": true
}
```

### 3. Supervisor
```json
{
  "name": "Supervisor Teste",
  "email": "supervisor@teste.com",
  "username": "supervisor",
  "password": "123456",
  "role": "SUPERVISOR",
  "active": true
}
```

### 4. RH
```json
{
  "name": "RH Teste",
  "email": "rh@teste.com",
  "username": "rh",
  "password": "123456",
  "role": "RH",
  "active": true
}
```

### 5. Financeiro
```json
{
  "name": "Financeiro Teste",
  "email": "financeiro@teste.com",
  "username": "financeiro",
  "password": "123456",
  "role": "FINANCEIRO",
  "active": true
}
```

### 6. TI Suporte
```json
{
  "name": "TI Suporte Teste",
  "email": "ti@teste.com",
  "username": "ti",
  "password": "123456",
  "role": "TI_SUPORTE",
  "active": true
}
```

### 7. Auditor
```json
{
  "name": "Auditor Teste",
  "email": "auditor@teste.com",
  "username": "auditor",
  "password": "123456",
  "role": "AUDITOR",
  "active": true
}
```

### 8. Colaborador
```json
{
  "name": "Colaborador Teste",
  "email": "colaborador@teste.com",
  "username": "colaborador",
  "password": "123456",
  "role": "COLABORADOR",
  "active": true
}
```

---

## 🔐 Login de Teste

### Endpoint: POST /api/auth/login

#### Super Admin
```json
{
  "email": "superadmin@teste.com",
  "password": "123456"
}
```

#### Admin
```json
{
  "email": "admin@teste.com",
  "password": "123456"
}
```

#### Supervisor
```json
{
  "email": "supervisor@teste.com",
  "password": "123456"
}
```

#### RH
```json
{
  "email": "rh@teste.com",
  "password": "123456"
}
```

#### Financeiro
```json
{
  "email": "financeiro@teste.com",
  "password": "123456"
}
```

#### TI Suporte
```json
{
  "email": "ti@teste.com",
  "password": "123456"
}
```

#### Auditor
```json
{
  "email": "auditor@teste.com",
  "password": "123456"
}
```

#### Colaborador
```json
{
  "email": "colaborador@teste.com",
  "password": "123456"
}
```

---

## 📊 Teste de Permissões

### Endpoint: GET /api/permissions/roles
**Headers:** Authorization: Bearer {token}

### Endpoint: GET /api/permissions/roles/{roleName}
**Exemplo:** GET /api/permissions/roles/SUPER_ADMIN

### Endpoint: GET /api/permissions/check?roleName=ADMIN&permissionName=USERS_CREATE
**Headers:** Authorization: Bearer {token}

### Endpoint: GET /api/permissions/hierarchy
**Headers:** Authorization: Bearer {token}

---

## 🎯 Permissões por Role

### 🟥 SUPER_ADMIN
- **Todas as permissões** (ALL_PERMISSIONS)

### 🟦 ADMIN
- USERS_READ, USERS_WRITE, USERS_CREATE
- GROUPS_READ, GROUPS_WRITE, GROUPS_CREATE
- CLIENTS_READ, CLIENTS_WRITE, CLIENTS_CREATE, CLIENTS_DELETE
- EMPLOYEES_READ, EMPLOYEES_WRITE, EMPLOYEES_CREATE, EMPLOYEES_DELETE
- CONTRACTS_READ, CONTRACTS_WRITE, CONTRACTS_CREATE, CONTRACTS_DELETE
- FINANCIAL_READ, FINANCIAL_WRITE, FINANCIAL_CREATE
- PAYSLIPS_READ, PAYSLIPS_WRITE, PAYSLIPS_CREATE, PAYSLIPS_PUBLISH
- REPORTS_READ, REPORTS_GENERATE, REPORTS_EXPORT
- DASHBOARD_READ, DASHBOARD_WRITE
- AUDIT_READ

### 🟩 SUPERVISOR
- EMPLOYEES_READ, EMPLOYEES_WRITE
- CONTRACTS_READ, CONTRACTS_WRITE
- PAYSLIPS_READ, PAYSLIPS_WRITE
- REPORTS_READ, REPORTS_GENERATE
- DASHBOARD_READ
- PROFILE_READ, PROFILE_WRITE

### 🟨 RH
- EMPLOYEES_READ, EMPLOYEES_WRITE, EMPLOYEES_CREATE, EMPLOYEES_DELETE
- PAYSLIPS_READ, PAYSLIPS_WRITE, PAYSLIPS_CREATE, PAYSLIPS_PUBLISH
- REPORTS_READ, REPORTS_GENERATE
- DASHBOARD_READ
- PROFILE_READ, PROFILE_WRITE

### 🟧 FINANCEIRO
- FINANCIAL_READ, FINANCIAL_WRITE, FINANCIAL_CREATE, FINANCIAL_DELETE
- PAYSLIPS_READ, PAYSLIPS_WRITE
- REPORTS_READ, REPORTS_GENERATE, REPORTS_EXPORT
- DASHBOARD_READ
- PROFILE_READ, PROFILE_WRITE

### 🟪 TI_SUPORTE
- SYSTEM_CONFIG, SYSTEM_LOGS, SYSTEM_BACKUP, SYSTEM_INTEGRATION
- USERS_READ, USERS_WRITE
- GROUPS_READ, GROUPS_WRITE
- DASHBOARD_READ
- PROFILE_READ, PROFILE_WRITE

### 🟫 AUDITOR
- USERS_READ
- CLIENTS_READ
- EMPLOYEES_READ
- CONTRACTS_READ
- FINANCIAL_READ
- PAYSLIPS_READ
- REPORTS_READ
- DASHBOARD_READ
- AUDIT_READ
- PROFILE_READ, PROFILE_WRITE

### 🟨 COLABORADOR
- PROFILE_READ, PROFILE_WRITE
- PAYSLIPS_READ

---

## 🚀 Como Testar

1. **Execute a migração:** `V200__update_user_roles.sql`
2. **Execute o script de usuários:** `insert_test_users_new_roles.sql`
3. **Teste o login** com cada usuário
4. **Verifique as permissões** usando os endpoints de permissões
5. **Teste o frontend** com os novos roles

---

## 📱 Frontend - URLs de Teste

- **Super Admin:** http://localhost:8082/dashboard (🟥)
- **Admin:** http://localhost:8082/dashboard (🟦)
- **Supervisor:** http://localhost:8082/dashboard (🟩)
- **RH:** http://localhost:8082/dashboard (🟨)
- **Financeiro:** http://localhost:8082/dashboard (🟧)
- **TI Suporte:** http://localhost:8082/dashboard (🟪)
- **Auditor:** http://localhost:8082/dashboard (🟫)
- **Colaborador:** http://localhost:8082/dashboard (🟨)

---

## 🔧 Configuração do Backend

**Porta:** 8081
**URL Base:** http://localhost:8081/api

**Endpoints principais:**
- POST /api/auth/login
- GET /api/permissions/roles
- GET /api/permissions/hierarchy
- GET /api/groups
- GET /api/users 