# Mapeamento de Rotas - Frontend

## Rotas Definidas no App.tsx

### Portal Público
- `/` → `PortalHome`
- `/portal` → `PortalHome`
- `/portal/vagas` → `PortalVagas`

### Sistema Administrativo
- `/admin` → Redireciona para `/login`
- `/login` → `Login`

### Rotas Protegidas

#### Dashboard
- `/dashboard` → `Index` (Dashboard principal)
- `/dashboard-home` → `Dashboard` (Dashboard detalhado)

#### Gestão de Pessoas
- `/employees` → `Funcionarios` (Inglês)
- `/funcionarios` → `Funcionarios` (Português)
- `/operacional` → `Operacional`
- `/escalas` → `Escalas`

#### Gestão de Clientes
- `/clients` → `Clientes` (Inglês)
- `/clientes` → `Clientes` (Português)
- `/filiais` → `Filiais`

#### Gestão de Contratos
- `/contracts` → `Contratos` (Inglês)
- `/contratos` → `Contratos` (Português)
- `/servicos` → `Servicos`

#### Financeiro
- `/financial` → `Financeiro` (Inglês)
- `/financeiro` → `Financeiro` (Português)
- `/payslips` → `Holerites` (Inglês)
- `/holerites` → `Holerites` (Português)
- `/payslip` → `PayslipView`

#### Frota
- `/fleet` → `Frota` (Inglês)
- `/frota` → `Frota` (Português)

#### Documentos e Relatórios
- `/documents` → `Documentos` (Inglês)
- `/documentos` → `Documentos` (Português)
- `/reports` → `Relatorios` (Inglês)
- `/relatorios` → `Relatorios` (Português)

#### Sistema
- `/grupos` → `Grupos`
- `/settings` → `Configuracoes` (Inglês)
- `/configuracoes` → `Configuracoes` (Português)
- `/profile` → `Profile` (Inglês)
- `/perfil` → `Profile` (Português)

#### Comunicação
- `/mensagens` → `Mensagens`

#### 404
- `*` → `NotFound`

## Mapeamento do Sidebar (Português)

### Menu Principal
| Texto | Rota | Página | Permissão |
|-------|------|--------|-----------|
| Dashboard | `/dashboard` | Index | DASHBOARD_READ |
| Operacional | `/operacional` | Operacional | EMPLOYEES_READ |
| Contratos | `/contratos` | Contratos | CONTRACTS_READ |
| Escalas | `/escalas` | Escalas | EMPLOYEES_READ |
| Clientes | `/clientes` | Clientes | CLIENTS_READ |
| Funcionários | `/funcionarios` | Funcionarios | EMPLOYEES_READ |
| Serviços | `/servicos` | Servicos | CONTRACTS_READ |
| Financeiro | `/financeiro` | Financeiro | FINANCIAL_READ |
| Holerites | `/holerites` | Holerites | PAYSLIPS_READ |
| Frota | `/frota` | Frota | FINANCIAL_READ |
| Filiais | `/filiais` | Filiais | CLIENTS_READ |
| Relatórios | `/relatorios` | Relatorios | REPORTS_READ |
| Usuários | `/funcionarios` | Funcionarios | USERS_READ (SUPER_ADMIN) |
| Grupos | `/grupos` | Grupos | GROUPS_READ (SUPER_ADMIN) |
| Sistema | `/configuracoes` | Configuracoes | SYSTEM_CONFIG (SUPER_ADMIN) |
| Configurações | `/configuracoes` | Configuracoes | SYSTEM_CONFIG |

## URLs Suportadas

### URLs em Português (Recomendadas)
- ✅ `http://localhost:8080/clientes`
- ✅ `http://localhost:8080/funcionarios`
- ✅ `http://localhost:8080/financeiro`
- ✅ `http://localhost:8080/holerites`
- ✅ `http://localhost:8080/frota`
- ✅ `http://localhost:8080/filiais`
- ✅ `http://localhost:8080/contratos`
- ✅ `http://localhost:8080/servicos`
- ✅ `http://localhost:8080/operacional`
- ✅ `http://localhost:8080/escalas`
- ✅ `http://localhost:8080/relatorios`
- ✅ `http://localhost:8080/documentos`
- ✅ `http://localhost:8080/configuracoes`
- ✅ `http://localhost:8080/perfil`

### URLs em Inglês (Alternativas)
- ✅ `http://localhost:8080/clients`
- ✅ `http://localhost:8080/employees`
- ✅ `http://localhost:8080/financial`
- ✅ `http://localhost:8080/payslips`
- ✅ `http://localhost:8080/fleet`
- ✅ `http://localhost:8080/contracts`
- ✅ `http://localhost:8080/reports`
- ✅ `http://localhost:8080/documents`
- ✅ `http://localhost:8080/settings`
- ✅ `http://localhost:8080/profile`

## Permissões por Role

### SUPER_ADMIN
- ✅ Acesso a todas as rotas
- ✅ `ALL_PERMISSIONS: true`
- ✅ Itens exclusivos: Usuários, Grupos, Sistema

### ADMIN
- ✅ Dashboard, Operacional, Contratos, Escalas
- ✅ Clientes, Funcionários, Serviços
- ✅ Financeiro, Holerites, Frota, Filiais
- ✅ Relatórios, Configurações

### RH
- ✅ Dashboard, Operacional, Escalas
- ✅ Funcionários, Holerites
- ✅ Configurações

### SUPERVISOR
- ✅ Dashboard, Operacional, Escalas
- ✅ Funcionários, Relatórios
- ✅ Configurações

### FINANCEIRO
- ✅ Dashboard, Financeiro, Holerites
- ✅ Relatórios, Configurações

### TI_SUPORTE
- ✅ Dashboard, Configurações
- ✅ Acesso limitado ao sistema

### AUDITOR
- ✅ Dashboard, Relatórios
- ✅ Acesso somente leitura

### COLABORADOR
- ✅ Dashboard
- ✅ Acesso limitado ao próprio perfil

## Como Adicionar Novas Rotas

1. **Criar a página** em `src/pages/`
2. **Adicionar import** no `App.tsx`
3. **Definir rotas** no `App.tsx` (inglês e português) com `ProtectedRoute`
4. **Adicionar item** no `SimpleSidebar.tsx` (usar rota em português)
5. **Definir permissão** apropriada
6. **Atualizar este documento**

## Exemplo de Nova Rota

```typescript
// 1. Criar página
// src/pages/NovaPagina.tsx

// 2. Importar no App.tsx
import NovaPagina from '@/pages/NovaPagina';

// 3. Adicionar rotas (inglês e português)
<Route path="/new-page" element={<ProtectedRoute><NovaPagina /></ProtectedRoute>} />
<Route path="/nova-pagina" element={<ProtectedRoute><NovaPagina /></ProtectedRoute>} />

// 4. Adicionar no sidebar (usar português)
{ 
  icon: IconName, 
  text: 'Nova Página', 
  to: '/nova-pagina', 
  id: 'nova-pagina',
  requiredPermission: 'NOVA_PAGINA_READ'
}
```

## Status das Rotas

✅ **Todas as rotas mapeadas corretamente**
✅ **Suporte a URLs em português e inglês**
✅ **Sidebar usando rotas em português**
✅ **Permissões definidas**
✅ **Proteção de rotas funcionando**
✅ **URLs testadas e funcionando** 