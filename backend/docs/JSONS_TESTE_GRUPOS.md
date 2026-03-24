# 📋 JSONs para Teste do Sistema de Grupos

## 🔐 1. LOGIN - Super Admin
```json
{
  "username": "superadmin@promover.com",
  "password": "SuperAdmin123!"
}
```

## 🔐 2. LOGIN - Admin
```json
{
  "username": "admin@promover.com",
  "password": "Admin123!"
}
```

## 🔐 3. LOGIN - RH
```json
{
  "username": "rh@promover.com",
  "password": "RH123!"
}
```

---

## 👥 4. CRIAR USUÁRIO - Super Admin
```json
{
  "username": "superadmin@promover.com",
  "email": "superadmin@promover.com",
  "password": "SuperAdmin123!",
  "name": "Super Administrador",
  "fullName": "Super Administrador do Sistema",
  "role": "CEO"
}
```

## 👥 5. CRIAR USUÁRIO - Admin
```json
{
  "username": "admin@promover.com",
  "email": "admin@promover.com",
  "password": "Admin123!",
  "name": "Administrador",
  "fullName": "Administrador do Sistema",
  "role": "ADMIN"
}
```

## 👥 6. CRIAR USUÁRIO - RH
```json
{
  "username": "rh@promover.com",
  "email": "rh@promover.com",
  "password": "RH123!",
  "name": "Recursos Humanos",
  "fullName": "Gerente de Recursos Humanos",
  "role": "RH"
}
```

## 👥 7. CRIAR USUÁRIO - Departamento Pessoal
```json
{
  "username": "dpe@promover.com",
  "email": "dpe@promover.com",
  "password": "DPE123!",
  "name": "Departamento Pessoal",
  "fullName": "Coordenador do Departamento Pessoal",
  "role": "DEPARTAMENTO_PESSOAL"
}
```

## 👥 8. CRIAR USUÁRIO - Gestor
```json
{
  "username": "gestor@promover.com",
  "email": "gestor@promover.com",
  "password": "Gestor123!",
  "name": "Gestor",
  "fullName": "Gestor de Contratos",
  "role": "GESTOR"
}
```

## 👥 9. CRIAR USUÁRIO - Supervisor
```json
{
  "username": "supervisor@promover.com",
  "email": "supervisor@promover.com",
  "password": "Supervisor123!",
  "name": "Supervisor",
  "fullName": "Supervisor de Equipe",
  "role": "SUPERVISOR"
}
```

## 👥 10. CRIAR USUÁRIO - Colaborador
```json
{
  "username": "colaborador@promover.com",
  "email": "colaborador@promover.com",
  "password": "Colaborador123!",
  "name": "Colaborador",
  "fullName": "Colaborador da Empresa",
  "role": "COLABORADOR"
}
```

## 👥 11. CRIAR USUÁRIO - Vigilante
```json
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

## 🏷️ 12. CRIAR GRUPO DE TESTE
```json
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

## 🏷️ 13. ATUALIZAR GRUPO
```json
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

---

## 🧪 14. USUÁRIO MULTI GRUPO - Criar
```json
{
  "username": "multigrupo@promover.com",
  "email": "multigrupo@promover.com",
  "password": "Multi123!",
  "name": "Usuário Multi Grupo",
  "fullName": "Usuário com Múltiplos Grupos",
  "role": "COLABORADOR"
}
```

---

## 📋 ENDPOINTS PARA TESTE

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrar usuário

### Grupos
- `POST /api/groups/initialize` - Inicializar grupos padrão
- `GET /api/groups` - Listar todos os grupos
- `GET /api/groups/{id}` - Buscar grupo por ID
- `POST /api/groups` - Criar novo grupo
- `PUT /api/groups/{id}` - Atualizar grupo
- `DELETE /api/groups/{id}` - Deletar grupo

### Usuários em Grupos
- `GET /api/groups/user/{userId}` - Grupos de um usuário
- `GET /api/groups/user/{userId}/permissions` - Permissões de um usuário
- `POST /api/groups/{groupId}/users/{userId}` - Adicionar usuário ao grupo
- `DELETE /api/groups/{groupId}/users/{userId}` - Remover usuário do grupo

---

## 🚀 SEQUÊNCIA RÁPIDA DE TESTE

1. **Criar Super Admin**: Use JSON #4
2. **Fazer Login**: Use JSON #1
3. **Inicializar Grupos**: `POST /api/groups/initialize`
4. **Listar Grupos**: `GET /api/groups`
5. **Criar Usuário Multi Grupo**: Use JSON #14
6. **Adicionar ao GRUPO_RH**: `POST /api/groups/4/users/{userId}`
7. **Verificar Permissões**: `GET /api/groups/user/{userId}/permissions`

---

## 📊 IDs DOS GRUPOS PADRÃO

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

## 🔧 CONFIGURAÇÃO POSTMAN

### Variáveis
- `baseUrl`: `http://localhost:8080`
- `token`: (preenchido automaticamente após login)

### Headers
- `Content-Type`: `application/json`
- `Authorization`: `Bearer {{token}}`

---

## ✅ RESULTADOS ESPERADOS

### Permissões Combinadas (Usuário Multi Grupo)
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

### Lista de Grupos
```json
[
  {
    "id": 1,
    "groupName": "GRUPO_SUPER_ADMIN",
    "displayName": "Super Administrador",
    "description": "Acesso total ao sistema",
    "permissions": [...],
    "userCount": 0
  },
  ...
]
``` 