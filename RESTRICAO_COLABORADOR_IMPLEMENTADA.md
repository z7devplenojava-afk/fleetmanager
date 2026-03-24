# 🔒 Restrição de Acesso para ROLE_COLABORADOR - Implementação Completa

## 📋 Resumo

Implementado sistema de controle de acesso restrito para usuários com `ROLE_COLABORADOR`, onde apenas o dashboard e comunicação interna ficam visíveis por padrão. O SUPER_ADMIN pode conceder permissões customizadas para habilitar funcionalidades específicas.

---

## ✅ O Que Foi Implementado

### 1️⃣ **Backend - Sistema de Permissões Customizadas**

#### **Tabela de Permissões Customizadas**
- **Migration**: `V264__create_user_custom_permissions.sql`
- **Tabela**: `user_custom_permissions`
- **Campos**:
  - `user_id`: ID do usuário
  - `permission_key`: Chave da permissão (ex: `FINANCIAL_READ`, `EMPLOYEES_READ`)
  - `enabled`: Se a permissão está ativa
  - `granted_by`: ID do SUPER_ADMIN que concedeu
  - `granted_at`: Data/hora da concessão
  - `revoked_at`: Data/hora da revogação

#### **Model, Repository e Service**
- **`UserCustomPermission.java`**: Modelo JPA
- **`UserCustomPermissionRepository.java`**: Repository com queries customizadas
- **`UserCustomPermissionService.java`**: Service com métodos:
  - `grantPermission()`: Conceder permissão
  - `revokePermission()`: Revogar permissão
  - `getActivePermissions()`: Buscar permissões ativas
  - `hasPermission()`: Verificar se tem permissão
  - `replacePermissions()`: Substituir todas as permissões

#### **Controller de Gerenciamento**
- **`UserCustomPermissionController.java`**: Endpoints REST (somente SUPER_ADMIN)
  - `GET /api/users/{userId}/custom-permissions` - Listar todas
  - `GET /api/users/{userId}/custom-permissions/active` - Listar ativas
  - `POST /api/users/{userId}/custom-permissions` - Conceder
  - `DELETE /api/users/{userId}/custom-permissions/{key}` - Revogar uma
  - `DELETE /api/users/{userId}/custom-permissions` - Revogar todas
  - `PUT /api/users/{userId}/custom-permissions` - Substituir todas
  - `GET /api/users/{userId}/custom-permissions/check/{key}` - Verificar

#### **Integração com Autenticação**
- **`AuthenticationServiceImpl.java`**: Atualizado para incluir `customPermissions` no retorno do login/refresh
- **`UserResponse.java`**: Adicionado campo `customPermissions`

---

### 2️⃣ **Frontend - Controle de Visibilidade**

#### **Tipos TypeScript**
- **`frontend/src/types/user.ts`**: Adicionado `customPermissions?: string[]` à interface `User`

#### **Sidebar com Controle de Permissões**
- **`frontend/src/components/CollapsibleSidebar.tsx`**: 
  - Atualizada lógica de `hasPermission()`:
    - SUPER_ADMIN: Acesso total
    - COLABORADOR: Apenas Dashboard + Comunicação Interna (por padrão)
    - COLABORADOR com permissões customizadas: Dashboard + Comunicação Interna + Módulos habilitados pelo SUPER_ADMIN
    - Outros roles: Verificação normal de permissões
  
  - Filtro no Menu Principal:
    ```typescript
    .filter(item => {
      // Se for COLABORADOR, mostra apenas Dashboard
      if (user?.role === 'ROLE_COLABORADOR' || user?.role === 'COLABORADOR') {
        return item.id === 'dashboard';
      }
      return true;
    })
    ```

---

## 🎯 Comportamento do Sistema

### **Para ROLE_COLABORADOR (Sem Permissões Customizadas)**

#### ✅ **Visível na Sidebar**:
- ✅ Dashboard (redireciona para `/dashboard-colaborador`)
- ✅ Comunicação Interna

#### ❌ **Oculto na Sidebar**:
- ❌ Holerites (menu principal)
- ❌ Frota
- ❌ Filiais
- ❌ Configurações
- ❌ Módulo Financeiro
- ❌ Módulo Operacional
- ❌ Recursos Humanos
- ❌ SST
- ❌ Departamento Pessoal
- ❌ Comercial
- ❌ Estoque
- ❌ Compras
- ❌ Atendimento
- ❌ Sistema (sempre oculto, exceto para SUPER_ADMIN)

---

### **Para ROLE_COLABORADOR (Com Permissões Customizadas)**

O SUPER_ADMIN pode conceder permissões específicas, por exemplo:

```json
{
  "userId": "uuid-do-colaborador",
  "customPermissions": [
    "FINANCIAL_READ",
    "EMPLOYEES_READ",
    "PAYSLIPS_READ"
  ]
}
```

Neste caso, o COLABORADOR verá na sidebar:
- ✅ Dashboard
- ✅ Comunicação Interna
- ✅ **Módulo Financeiro** (habilitado)
- ✅ **Recursos Humanos** (habilitado)
- ✅ Holerites (se `PAYSLIPS_READ` estiver concedido)

---

## 🔑 Permissões Disponíveis para Concessão

### **Principais Permissões**:
- `FINANCIAL_READ` - Acesso ao Módulo Financeiro
- `EMPLOYEES_READ` - Acesso ao Módulo RH
- `PAYSLIPS_READ` - Acesso aos Holerites
- `EQUIPMENTS_READ` - Acesso aos Equipamentos/Frota
- `COMPANIES_READ` - Acesso às Empresas/Filiais
- `OPERATIONAL_READ` - Acesso ao Módulo Operacional
- `REPORTS_READ` - Acesso aos Relatórios
- `ATTENDANCE_READ` - Acesso ao Atendimento
- `STOCK_READ` - Acesso ao Estoque

> **Nota**: A permissão `MESSAGES_READ` (Comunicação Interna) é sempre concedida automaticamente para COLABORADOR.

---

## 🛠️ Como o SUPER_ADMIN Concede Permissões

### **1. Via API REST (Postman/Insomnia)**

#### **Conceder uma permissão**:
```http
POST /api/users/{userId}/custom-permissions
Authorization: Bearer {token-super-admin}
Content-Type: application/json

{
  "permissionKey": "FINANCIAL_READ"
}
```

#### **Conceder múltiplas permissões de uma vez**:
```http
PUT /api/users/{userId}/custom-permissions
Authorization: Bearer {token-super-admin}
Content-Type: application/json

[
  "FINANCIAL_READ",
  "EMPLOYEES_READ",
  "PAYSLIPS_READ"
]
```

#### **Revogar uma permissão**:
```http
DELETE /api/users/{userId}/custom-permissions/FINANCIAL_READ
Authorization: Bearer {token-super-admin}
```

#### **Listar permissões ativas de um usuário**:
```http
GET /api/users/{userId}/custom-permissions/active
Authorization: Bearer {token-super-admin}
```

---

### **2. Via Interface Web (Futuro)**

Uma interface de gerenciamento de permissões pode ser implementada futuramente em:
- `/usuarios/{userId}/permissoes` - Painel de controle de permissões por usuário

Exemplo de interface:
```
┌─────────────────────────────────────────┐
│ Permissões Customizadas - João Silva   │
├─────────────────────────────────────────┤
│ [✓] Módulo Financeiro                   │
│ [ ] Recursos Humanos                    │
│ [✓] Holerites                           │
│ [ ] Operacional                         │
│ [ ] Estoque                             │
│                                         │
│ [Salvar Alterações]                    │
└─────────────────────────────────────────┘
```

---

## 📊 Fluxo de Dados

```
Login do COLABORADOR
       ↓
AuthenticationService busca permissões customizadas
       ↓
Retorna UserResponse com customPermissions: ["FINANCIAL_READ", ...]
       ↓
Frontend armazena no localStorage + AuthContext
       ↓
CollapsibleSidebar verifica customPermissions
       ↓
Renderiza apenas módulos permitidos
```

---

## 🔐 Senha Padrão para COLABORADOR

Quando um holerite é enviado, o sistema cria automaticamente um usuário `COLABORADOR`:

- **Username**: CPF (sem pontos/traços)
- **Senha padrão**: `{CPF}@2025`

### **Exemplo**:
- CPF: `123.456.789-00`
- Username: `12345678900`
- Senha: `12345678900@2025`

---

## 🧪 Como Testar

### **1. Login como COLABORADOR**
```
Username: CPF do funcionário (ex: 12345678900)
Senha: {CPF}@2025
```

### **2. Verificar Sidebar**
- Deve mostrar apenas: Dashboard + Comunicação Interna

### **3. Conceder Permissão (via Postman como SUPER_ADMIN)**
```json
POST /api/users/{userId}/custom-permissions
{
  "permissionKey": "FINANCIAL_READ"
}
```

### **4. Relogar como COLABORADOR**
- Agora deve mostrar: Dashboard + Comunicação Interna + **Módulo Financeiro**

---

## 📁 Arquivos Modificados

### **Backend**:
- ✅ `V264__create_user_custom_permissions.sql`
- ✅ `UserCustomPermission.java`
- ✅ `UserCustomPermissionRepository.java`
- ✅ `UserCustomPermissionService.java`
- ✅ `UserCustomPermissionController.java`
- ✅ `AuthenticationServiceImpl.java`
- ✅ `UserResponse.java`

### **Frontend**:
- ✅ `frontend/src/types/user.ts`
- ✅ `frontend/src/components/CollapsibleSidebar.tsx`

---

## ✅ Status

- ✅ Backend: Implementado e pronto
- ✅ Frontend: Implementado e pronto
- ✅ Migração de banco: Criada
- ⏳ Interface web de gerenciamento: Aguardando implementação futura
- ⏳ Backend reiniciado: Executar para aplicar migration

---

## 🚀 Próximos Passos

1. **Reiniciar o backend** para aplicar a migration `V264`
2. **Testar o fluxo completo** de concessão/revogação de permissões
3. **Criar interface web** para gerenciamento de permissões (opcional)
4. **Documentar permissões disponíveis** no manual do SUPER_ADMIN

---

## 📞 Suporte

Para dúvidas sobre este sistema:
- Verificar logs do backend: `backend/logs/`
- Console do navegador (F12) para debug frontend
- Endpoints de API: `/api/users/{userId}/custom-permissions/*`

**Data da Implementação**: 23/10/2025  
**Versão**: 1.0

