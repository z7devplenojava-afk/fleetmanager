# 🚀 JSONs para Teste no Postman - Secure Guard

## 📋 Configuração Inicial

### Base URL
```
http://localhost:8081/api/v1
```

### Headers Padrão
```
Content-Type: application/json
Authorization: Bearer {token}
```

---

## 🔐 1. AUTENTICAÇÃO

### 1.1 Login
**POST** `/auth/login`

```json
{
  "username": "superadmin@promover.com",
  "password": "Password123!"
}
```

**Resposta Esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "superadmin@promover.com",
    "email": "superadmin@promover.com",
    "name": "Super Administrador",
    "role": "CEO",
    "status": "ACTIVE",
    "groups": [
      {
        "id": 1,
        "name": "GRUPO_SUPER_ADMIN",
        "displayName": "Super Admin",
        "permissions": ["*"]
      }
    ]
  }
}
```

### 1.2 Teste com Outros Usuários

**Admin:**
```json
{
  "username": "admin@promover.com",
  "password": "Password123!"
}
```

**RH:**
```json
{
  "username": "rh@promover.com",
  "password": "Password123!"
}
```

**Multi Grupo:**
```json
{
  "username": "multigrupo@promover.com",
  "password": "Password123!"
}
```

---

## 👥 2. GRUPOS

### 2.1 Listar Todos os Grupos
**GET** `/groups`

**Headers:**
```
Authorization: Bearer {token}
```

### 2.2 Criar Novo Grupo
**POST** `/groups`

```json
{
  "name": "GRUPO_TESTE",
  "displayName": "Grupo de Teste",
  "description": "Grupo criado para testes",
  "permissions": [
    "CLIENTS_READ",
    "CLIENTS_WRITE",
    "EMPLOYEES_READ"
  ]
}
```

### 2.3 Atualizar Grupo
**PUT** `/groups/{id}`

```json
{
  "name": "GRUPO_TESTE_ATUALIZADO",
  "displayName": "Grupo de Teste Atualizado",
  "description": "Grupo atualizado para testes",
  "permissions": [
    "CLIENTS_READ",
    "CLIENTS_WRITE",
    "EMPLOYEES_READ",
    "EMPLOYEES_WRITE"
  ]
}
```

### 2.4 Adicionar Usuário ao Grupo
**POST** `/groups/{groupId}/users/{userId}`

**Exemplo:**
```
POST /groups/4/users/550e8400-e29b-41d4-a716-446655440007
```

### 2.5 Remover Usuário do Grupo
**DELETE** `/groups/{groupId}/users/{userId}`

**Exemplo:**
```
DELETE /groups/4/users/550e8400-e29b-41d4-a716-446655440007
```

### 2.6 Listar Usuários de um Grupo
**GET** `/groups/{id}/users`

### 2.7 Listar Grupos de um Usuário
**GET** `/users/{id}/groups`

---

## 👤 3. USUÁRIOS

### 3.1 Listar Todos os Usuários
**GET** `/users`

**Query Parameters:**
```
?page=0&size=10&sortBy=name&sortDir=ASC
```

### 3.2 Buscar Usuário por ID
**GET** `/users/{id}`

**Exemplo:**
```
GET /users/550e8400-e29b-41d4-a716-446655440001
```

### 3.3 Criar Novo Usuário
**POST** `/users`

```json
{
  "username": "novo@promover.com",
  "email": "novo@promover.com",
  "password": "Password123!",
  "name": "Novo Usuário",
  "role": "COLABORADOR",
  "status": "ACTIVE"
}
```

### 3.4 Atualizar Usuário
**PUT** `/users/{id}`

```json
{
  "username": "usuario.atualizado@promover.com",
  "email": "usuario.atualizado@promover.com",
  "name": "Usuário Atualizado",
  "role": "SUPERVISOR",
  "status": "ACTIVE"
}
```

### 3.5 Alterar Senha
**PUT** `/users/{id}/password`

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NovaSenha123!"
}
```

---

## 🏢 4. CLIENTES

### 4.1 Listar Clientes
**GET** `/clients`

**Query Parameters:**
```
?page=0&size=10&searchTerm=&status=ACTIVE&sortBy=name&sortDir=ASC
```

### 4.2 Criar Cliente
**POST** `/clients`

```json
{
  "name": "Empresa Teste Ltda",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@empresateste.com",
  "phone": "(11) 99999-9999",
  "address": {
    "street": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "status": "ACTIVE",
  "contactPerson": "João Silva",
  "contactPhone": "(11) 88888-8888"
}
```

### 4.3 Atualizar Cliente
**PUT** `/clients/{id}`

```json
{
  "name": "Empresa Teste Atualizada Ltda",
  "cnpj": "12.345.678/0001-90",
  "email": "contato.atualizado@empresateste.com",
  "phone": "(11) 99999-9999",
  "address": {
    "street": "Rua das Flores, 456",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "status": "ACTIVE",
  "contactPerson": "Maria Santos",
  "contactPhone": "(11) 77777-7777"
}
```

---

## 👷 5. FUNCIONÁRIOS

### 5.1 Listar Funcionários
**GET** `/employees`

**Query Parameters:**
```
?page=0&size=10&searchTerm=&status=ACTIVE&sortBy=name&sortDir=ASC
```

### 5.2 Criar Funcionário
**POST** `/employees`

```json
{
  "name": "Carlos Oliveira",
  "cpf": "123.456.789-00",
  "email": "carlos.oliveira@promover.com",
  "phone": "(11) 98765-4321",
  "position": "VIGILANTE",
  "status": "ACTIVE",
  "hireDate": "2024-01-15",
  "salary": 1800.00,
  "address": {
    "street": "Rua do Trabalho, 100",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  }
}
```

---

## 📄 6. CONTRATOS

### 6.1 Listar Contratos
**GET** `/contracts`

**Query Parameters:**
```
?page=0&size=10&searchTerm=&status=ACTIVE&sortBy=startDate&sortDir=DESC
```

### 6.2 Criar Contrato
**POST** `/contracts`

```json
{
  "clientId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "value": 50000.00,
  "status": "ACTIVE",
  "description": "Contrato de vigilância patrimonial",
  "services": [
    "VIGILANCIA_PATRIMONIAL",
    "PORTARIA"
  ],
  "employees": [
    {
      "employeeId": 1,
      "position": "VIGILANTE",
      "salary": 1800.00
    }
  ]
}
```

---

## 💰 7. FINANCEIRO

### 7.1 Listar Faturas
**GET** `/invoices`

**Query Parameters:**
```
?page=0&size=10&status=PENDING&sortBy=dueDate&sortDir=ASC
```

### 7.2 Criar Fatura
**POST** `/invoices`

```json
{
  "clientId": 1,
  "contractId": 1,
  "amount": 5000.00,
  "dueDate": "2024-02-15",
  "description": "Fatura mensal - Janeiro 2024",
  "status": "PENDING"
}
```

---

## 📊 8. RELATÓRIOS

### 8.1 Dashboard Stats
**GET** `/dashboard/stats`

### 8.2 Relatório de Funcionários
**GET** `/reports/employees`

**Query Parameters:**
```
?startDate=2024-01-01&endDate=2024-12-31&status=ACTIVE
```

### 8.3 Relatório Financeiro
**GET** `/reports/financial`

**Query Parameters:**
```
?startDate=2024-01-01&endDate=2024-12-31&type=REVENUE
```

---

## 🔍 9. TESTES DE PERMISSÕES

### 9.1 Verificar Permissões do Usuário
**GET** `/auth/permissions`

### 9.2 Testar Acesso a Recurso
**GET** `/clients` (com diferentes usuários)

**Usuários para Teste:**
- `superadmin@promover.com` - Acesso total
- `admin@promover.com` - Acesso administrativo
- `rh@promover.com` - Acesso RH
- `colaborador@promover.com` - Acesso limitado
- `multigrupo@promover.com` - Múltiplas permissões

---

## 📝 10. EXEMPLOS DE TESTE COMPLETO

### 10.1 Fluxo Completo de Criação de Cliente

1. **Login:**
```json
POST /auth/login
{
  "username": "admin@promover.com",
  "password": "Password123!"
}
```

2. **Criar Cliente:**
```json
POST /clients
{
  "name": "Shopping Center Norte",
  "cnpj": "98.765.432/0001-10",
  "email": "gerencia@shoppingnorte.com",
  "phone": "(11) 5555-5555",
  "address": {
    "street": "Av. Paulista, 1000",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  },
  "status": "ACTIVE",
  "contactPerson": "Ana Paula",
  "contactPhone": "(11) 4444-4444"
}
```

3. **Criar Funcionário:**
```json
POST /employees
{
  "name": "João Silva",
  "cpf": "111.222.333-44",
  "email": "joao.silva@promover.com",
  "phone": "(11) 3333-3333",
  "position": "VIGILANTE",
  "status": "ACTIVE",
  "hireDate": "2024-01-20",
  "salary": 1900.00
}
```

4. **Criar Contrato:**
```json
POST /contracts
{
  "clientId": 1,
  "startDate": "2024-02-01",
  "endDate": "2024-12-31",
  "value": 75000.00,
  "status": "ACTIVE",
  "description": "Vigilância 24h Shopping Center Norte",
  "services": ["VIGILANCIA_PATRIMONIAL", "PORTARIA", "CONTROLADOR_ACESSO"]
}
```

---

## ⚠️ 11. TRATAMENTO DE ERROS

### 11.1 Erro de Autenticação
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Token inválido ou expirado",
  "path": "/api/v1/clients"
}
```

### 11.2 Erro de Validação
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Erro de validação",
  "errors": [
    {
      "field": "email",
      "message": "Email deve ser válido"
    }
  ],
  "path": "/api/v1/users"
}
```

### 11.3 Erro de Permissão
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Acesso negado. Permissão necessária: CLIENTS_WRITE",
  "path": "/api/v1/clients"
}
```

---

## 🎯 12. DICAS DE TESTE

### 12.1 Variáveis do Postman
Configure estas variáveis no Postman:

```
baseUrl: http://localhost:8081/api/v1
token: (será preenchido após login)
userId: (ID do usuário logado)
```

### 12.2 Script de Pré-request (Login Automático)
```javascript
// No teste de login, adicione este script:
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    pm.environment.set("userId", jsonData.user.id);
});
```

### 12.3 Headers Automáticos
Configure no Postman:
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

---

## 🚀 13. TESTE RÁPIDO

### Sequência de Teste:
1. **Login** com `superadmin@promover.com`
2. **Listar Grupos** - Verificar se todos os grupos estão carregados
3. **Listar Usuários** - Verificar usuários e seus grupos
4. **Criar Cliente** - Testar criação
5. **Listar Clientes** - Verificar se foi criado
6. **Testar Permissões** - Fazer login com diferentes usuários

### Usuários para Teste de Permissões:
- **Super Admin**: Acesso total
- **Admin**: Acesso administrativo  
- **RH**: Acesso a recursos humanos
- **Multi Grupo**: Teste de múltiplas permissões
- **Colaborador**: Acesso limitado

---

## 📞 14. SUPORTE

Se encontrar problemas:
1. Verifique se o backend está rodando na porta 8081
2. Confirme se o banco PostgreSQL está conectado
3. Verifique os logs do backend
4. Teste primeiro o endpoint de health: `GET /actuator/health`

---

**🎉 Agora você tem todos os JSONs necessários para testar completamente o sistema no Postman!** 