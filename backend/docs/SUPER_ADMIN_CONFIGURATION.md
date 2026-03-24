# 🔥 Configuração do SUPER_ADMIN - Acesso Total ao Sistema

## 📋 Visão Geral

O usuário `SUPER_ADMIN` deve ter acesso irrestrito a todas as funcionalidades do sistema SecuredGuard. Este documento explica como garantir que isso funcione corretamente.

## 👤 Dados do Usuário SUPER_ADMIN

```json
{
  "username": "superadmin",
  "email": "superadmin@promover.com",
  "password": "Password123!",
  "name": "Super Administrador",
  "fullName": "Super Administrador do Sistema",
  "role": "SUPER_ADMIN"
}
```

## 🔐 Configuração de Permissões

### Backend (Java/Spring)

O `SUPER_ADMIN` já está configurado corretamente no backend:

1. **PermissionService.java** - Define `ALL_PERMISSIONS` para SUPER_ADMIN
2. **UserRole.java** - SUPER_ADMIN é o primeiro role definido
3. **SecurityConfig.java** - Configurações de segurança aplicam-se a todos os roles

### Frontend (React/TypeScript)

O frontend foi atualizado para incluir o SUPER_ADMIN:

1. **permissions.ts** - SUPER_ADMIN tem `ALL_PERMISSIONS: true`
2. **user.ts** - SUPER_ADMIN incluído no tipo UserRole
3. **Menu configurado** - Todas as funcionalidades disponíveis

## 🚀 Como Implementar

### 1. Executar Script SQL

```bash
# Execute o script para criar o usuário
psql -d secured_guard -f insert_superadmin_user.sql
```

### 2. Verificar Configuração

```sql
-- Verificar se o usuário foi criado
SELECT * FROM users WHERE role = 'SUPER_ADMIN';

-- Verificar permissões do grupo
SELECT * FROM user_group_permissions WHERE group_id = (
  SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'
);
```

### 3. Testar Login

```bash
# Endpoint de login
POST /api/auth/login
{
  "email": "superadmin@promover.com",
  "password": "Password123!"
}
```

## 📊 Funcionalidades Disponíveis

### 🟥 SUPER_ADMIN tem acesso a:

- ✅ **Dashboard** - Visualização completa
- ✅ **Usuários** - CRUD completo
- ✅ **Grupos** - CRUD completo  
- ✅ **Colaboradores** - CRUD completo
- ✅ **Clientes** - CRUD completo
- ✅ **Contratos** - CRUD completo
- ✅ **Financeiro** - CRUD completo
- ✅ **Holerites** - CRUD completo
- ✅ **Relatórios** - Geração e exportação
- ✅ **Sistema** - Configurações avançadas
- ✅ **Auditoria** - Logs completos
- ✅ **Configurações** - Todas as configurações

## 🔧 Verificação de Permissões

### Backend Endpoints

```bash
# Verificar permissões do SUPER_ADMIN
GET /api/permissions/roles/SUPER_ADMIN
Authorization: Bearer {token}

# Verificar hierarquia de roles
GET /api/permissions/hierarchy
Authorization: Bearer {token}
```

### Frontend Verificação

```typescript
// Verificar se usuário tem permissão específica
import { hasPermission } from '@/utils/permissions';

const canManageUsers = hasPermission(user.permissions, 'USERS_CREATE');
const hasAllAccess = hasPermission(user.permissions, 'ALL_PERMISSIONS');
```

## 🛡️ Segurança

### Backend Security

1. **JWT Token** - Inclui role SUPER_ADMIN
2. **Method Security** - `@PreAuthorize("hasRole('SUPER_ADMIN')")`
3. **Permission Checks** - `ALL_PERMISSIONS` override

### Frontend Security

1. **Route Guards** - Verificação de permissões
2. **Component Guards** - `PermissionGuard` component
3. **Menu Filtering** - Baseado em permissões

## 🧪 Testes

### Teste de Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@promover.com",
    "password": "Password123!"
  }'
```

### Teste de Permissões

```bash
# Com token obtido do login
curl -X GET http://localhost:8080/api/permissions/roles/SUPER_ADMIN \
  -H "Authorization: Bearer {token}"
```

### Teste Frontend

1. Acesse `http://localhost:8082`
2. Faça login com `superadmin@promover.com`
3. Verifique se todas as funcionalidades estão disponíveis
4. Teste navegação por todos os menus

## 🔍 Troubleshooting

### Problema: Usuário não consegue acessar funcionalidades

**Solução:**
1. Verificar se o role está correto no banco
2. Verificar se o grupo está associado
3. Verificar se as permissões estão configuradas
4. Verificar se o token JWT inclui o role

### Problema: Frontend não mostra menus

**Solução:**
1. Verificar se o `generatePermissions` inclui SUPER_ADMIN
2. Verificar se o `MENU_CONFIG` tem SUPER_ADMIN
3. Verificar se o `AuthContext` está carregando permissões

### Problema: Backend retorna 403

**Solução:**
1. Verificar se o `@PreAuthorize` está configurado
2. Verificar se o `PermissionService` está funcionando
3. Verificar se o `ALL_PERMISSIONS` está sendo aplicado

## 📝 Logs de Verificação

### Backend Logs

```bash
# Verificar logs de autenticação
tail -f logs/application.log | grep "SUPER_ADMIN"

# Verificar logs de permissões
tail -f logs/application.log | grep "ALL_PERMISSIONS"
```

### Frontend Console

```javascript
// Verificar permissões no console
console.log('User Permissions:', user.permissions);
console.log('Has All Permissions:', user.permissions.ALL_PERMISSIONS);
```

## ✅ Checklist de Verificação

- [ ] Usuário criado no banco de dados
- [ ] Role SUPER_ADMIN configurado
- [ ] Grupo GRUPO_SUPER_ADMIN associado
- [ ] Permissões ALL_PERMISSIONS ativas
- [ ] Backend reconhece permissões
- [ ] Frontend gera permissões corretas
- [ ] Login funciona corretamente
- [ ] Todos os menus aparecem
- [ ] Todas as funcionalidades acessíveis
- [ ] Testes passando

## 🎯 Resultado Esperado

O usuário `superadmin@promover.com` deve:

1. **Fazer login** sem problemas
2. **Ver todos os menus** disponíveis
3. **Acessar todas as funcionalidades** sem restrições
4. **Ter permissões totais** em todo o sistema
5. **Poder gerenciar** qualquer aspecto do sistema

---

**Status:** ✅ Configurado e Funcionando  
**Última Atualização:** 2025-01-27  
**Responsável:** Sistema de Permissões 