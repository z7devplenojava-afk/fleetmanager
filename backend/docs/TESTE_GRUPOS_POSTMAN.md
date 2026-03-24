# 🧪 Teste do Sistema de Grupos - Postman

## 📋 Configuração Inicial

### 1. Variáveis do Postman
Configure as seguintes variáveis na collection:
- `baseUrl`: `http://localhost:8080`
- `token`: (será preenchido automaticamente após login)

---

## 🔐 Autenticação

### Login - Super Admin
```json
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "superadmin@promover.com",
  "password": "SuperAdmin123!"
}
```

### Login - Admin
```json
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "admin@promover.com",
  "password": "Admin123!"
}
```

### Login - RH
```json
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "rh@promover.com",
  "password": "RH123!"
}
```

---

## 👥 Criação de Usuários

### 1. Super Admin
```json
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "superadmin@promover.com",
  "email": "superadmin@promover.com",
  "password": "SuperAdmin123!",
  "name": "Super Administrador",
  "fullName": "Super Administrador do Sistema",
  "role": "CEO"
}
```

### 2. Admin
```json
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "admin@promover.com",
  "email": "admin@promover.com",
  "password": "Admin123!",
  "name": "Administrador",
  "fullName": "Administrador do Sistema",
  "role": "ADMIN"
}
```

### 3. RH
```json
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "rh@promover.com",
  "email": "rh@promover.com",
  "password": "RH123!",
  "name": "Recursos Humanos",
  "fullName": "Gerente de Recursos Humanos",
  "role": "RH"
}
```

### 4. Departamento Pessoal
```json
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "dpe@promover.com",
  "email": "dpe@promover.com",
  "password": "DPE123!",
  "name": "Departamento Pessoal",
  "fullName": "Coordenador do Departamento Pessoal",
  "role": "DEPARTAMENTO_PESSOAL"
}
```

### 5. Gestor
```json
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "gestor@promover.com",
  "email": "gestor@promover.com",
  "password": "Gestor123!",
  "name": "Gestor",
  "fullName": "Gestor de Contratos",
  "role": "GESTOR"
}
```

### 6. Supervisor
```json
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "supervisor@promover.com",
  "email": "supervisor@promover.com",
  "password": "Supervisor123!",
  "name": "Supervisor",
  "fullName": "Supervisor de Equipe",
  "role": "SUPERVISOR"
}
```

### 7. Colaborador
```json
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "colaborador@promover.com",
  "email": "colaborador@promover.com",
  "password": "Colaborador123!",
  "name": "Colaborador",
  "fullName": "Colaborador da Empresa",
  "role": "COLABORADOR"
}
```

### 8. Vigilante
```json
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "vigilante@promover.com",
  "email": "vigilante@promover.com",
  "password": "Vigilante123!",
  "name": "Vigilante",
  "fullName": "Vigilante de Segurança",
  "role": "VIGILANTE"
}
```

---

## 🏷️ Gerenciamento de Grupos

### 1. Inicializar Grupos Padrão
```json
POST {{baseUrl}}/api/groups/initialize
Authorization: Bearer {{token}}
```

### 2. Listar Todos os Grupos
```json
GET {{baseUrl}}/api/groups
Authorization: Bearer {{token}}
```

### 3. Buscar Grupo por ID
```json
GET {{baseUrl}}/api/groups/1
Authorization: Bearer {{token}}
```

### 4. Criar Novo Grupo
```json
POST {{baseUrl}}/api/groups
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "groupName": "GRUPO_TESTE",
  "displayName": "Grupo de Teste",
  "description": "Grupo criado para testes",
  "permissions": [
    "VIEW_PAYSLIP",
    "DOWNLOAD_PAYSLIP",
    "EDIT_PROFILE"
  ]
}
```

### 5. Atualizar Grupo
```json
PUT {{baseUrl}}/api/groups/1
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "displayName": "Grupo de Teste Atualizado",
  "description": "Grupo atualizado para testes",
  "permissions": [
    "VIEW_PAYSLIP",
    "DOWNLOAD_PAYSLIP",
    "EDIT_PROFILE",
    "VIEW_EMPLOYEES"
  ]
}
```

### 6. Deletar Grupo
```json
DELETE {{baseUrl}}/api/groups/9
Authorization: Bearer {{token}}
```

---

## 👤 Gerenciamento de Usuários em Grupos

### 1. Buscar Grupos de um Usuário
```json
GET {{baseUrl}}/api/groups/user/{{userId}}
Authorization: Bearer {{token}}
```

### 2. Buscar Permissões de um Usuário
```json
GET {{baseUrl}}/api/groups/user/{{userId}}/permissions
Authorization: Bearer {{token}}
```

### 3. Adicionar Usuário ao Grupo
```json
POST {{baseUrl}}/api/groups/1/users/{{userId}}
Authorization: Bearer {{token}}
```

### 4. Remover Usuário do Grupo
```json
DELETE {{baseUrl}}/api/groups/1/users/{{userId}}
Authorization: Bearer {{token}}
```

---

## 🧪 Testes de Cenários

### Cenário 1: Usuário com Múltiplos Grupos

#### 1. Criar Usuário de Teste
```json
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "multigrupo@promover.com",
  "email": "multigrupo@promover.com",
  "password": "Multi123!",
  "name": "Usuário Multi Grupo",
  "fullName": "Usuário com Múltiplos Grupos",
  "role": "COLABORADOR"
}
```

#### 2. Adicionar ao GRUPO_RH (ID: 4)
```json
POST {{baseUrl}}/api/groups/4/users/{{userId}}
Authorization: Bearer {{token}}
```

#### 3. Adicionar ao GRUPO_SUPERVISOR (ID: 6)
```json
POST {{baseUrl}}/api/groups/6/users/{{userId}}
Authorization: Bearer {{token}}
```

#### 4. Verificar Permissões Combinadas
```json
GET {{baseUrl}}/api/groups/user/{{userId}}/permissions
Authorization: Bearer {{token}}
```

**Resultado Esperado:**
```json
[
  "VIEW_PAYSLIP",
  "DOWNLOAD_PAYSLIP",
  "EDIT_PROFILE",
  "VIEW_EMPLOYEES",
  "MANAGE_EMPLOYEES",
  "VIEW_REPORTS",
  "VIEW_CLIENTS",
  "VIEW_CONTRACTS",
  "VIEW_FINANCIAL",
  "VIEW_FLEET",
  "VIEW_DOCUMENTS"
]
```

---

## 📊 IDs dos Grupos Padrão

Após inicializar os grupos, os IDs serão:

| ID | Grupo | Nome |
|----|-------|------|
| 1 | GRUPO_SUPER_ADMIN | Super Administrador |
| 2 | GRUPO_ADMIN | Administrador |
| 3 | GRUPO_GESTOR | Gestor |
| 4 | GRUPO_RH | Recursos Humanos |
| 5 | GRUPO_DPE | Departamento Pessoal |
| 6 | GRUPO_SUPERVISOR | Supervisor |
| 7 | GRUPO_COLABORADORES | Colaboradores |
| 8 | GRUPO_VIGILANTES | Vigilantes |

---

## 🚀 Sequência de Teste Recomendada

1. **Inicializar Grupos**: `POST /api/groups/initialize`
2. **Criar Usuários**: Registrar todos os tipos de usuários
3. **Fazer Login**: Como Super Admin
4. **Listar Grupos**: `GET /api/groups`
5. **Testar Cenários**: Adicionar usuários a múltiplos grupos
6. **Verificar Permissões**: Confirmar herança de permissões

---

## 🔍 Verificações Importantes

### 1. Permissões Combinadas
- Usuário com role COLABORADOR + GRUPO_RH deve ter permissões de ambos
- Permissões devem ser somadas (OR lógico)

### 2. Múltiplos Grupos
- Usuário pode pertencer a vários grupos
- Todas as permissões dos grupos são herdadas

### 3. Segurança
- Apenas usuários com MANAGE_SYSTEM podem gerenciar grupos
- Apenas usuários com MANAGE_EMPLOYEES podem adicionar/remover usuários

---

## 📝 Notas

- Substitua `{{userId}}` pelo ID real do usuário
- Use o token retornado no login para autenticar as requisições
- Verifique os logs do backend para debug
- Teste no frontend após confirmar funcionamento no Postman 