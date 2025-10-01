# Correções de Erros API - Frontend

## Problemas Identificados

### 1. Erro 500 na API de Grupos
**Problema:** `Failed to load resource: the server responded with a status of 500 ()`
**URL:** `:8081/api/api/groups/user/1`
**Causa:** Duplicação do prefixo `/api` nas URLs

### 2. Erro no Select.Item
**Problema:** `A <Select.Item /> must have a value prop that is not an empty string`
**Causa:** SelectItem com `value=""` não é permitido pelo Radix UI

### 3. Erro 500 na API de Clientes
**Problema:** `Failed to load resource: the server responded with a status of 500 ()`
**URL:** `:8081/api/api/clients?page=0&size=10&sortBy=name&sortDir=ASC`
**Causa:** Duplicação do prefixo `/api` nas URLs

## Soluções Implementadas

### 1. Correção das URLs da API

**Problema:** O axios está configurado com `baseURL: 'http://localhost:8081/api'`, mas os services estavam fazendo requisições para `/api/...`, resultando em URLs duplicadas como `http://localhost:8081/api/api/...`

**Solução:** Remover o prefixo `/api` de todos os services

#### Antes (Incorreto):
```typescript
// axios.ts
baseURL: 'http://localhost:8081/api'

// clientService.ts
const response = await api.get('/api/clients');

// groupService.ts
const response = await api.get('/api/groups/user/${userId}');
```

#### Depois (Correto):
```typescript
// axios.ts
baseURL: 'http://localhost:8081/api'

// clientService.ts
const response = await api.get('/clients');

// groupService.ts
const response = await api.get('/groups/user/${userId}');
```

### 2. Correção do Select.Item

**Problema:** Radix UI não permite `SelectItem` com `value=""`

**Solução:** Usar `value="all"` em vez de `value=""`

#### Antes (Incorreto):
```typescript
<SelectItem value="">Todos os status</SelectItem>
```

#### Depois (Correto):
```typescript
<SelectItem value="all">Todos os status</SelectItem>
```

### 3. Atualização da Lógica de Filtros

**Problema:** A lógica de filtros precisava ser atualizada para usar `"all"` em vez de string vazia

**Solução:** Atualizar toda a lógica de filtros

```typescript
// Antes
const [statusFilter, setStatusFilter] = useState<ClientStatus | ''>('');
const status = statusFilter || undefined;

// Depois
const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
const status = statusFilter === 'all' ? undefined : statusFilter;
```

## Arquivos Corrigidos

### 1. `frontend/src/services/clientService.ts`
- ✅ Removido prefixo `/api` de todas as URLs
- ✅ URLs agora corretas: `/clients`, `/clients/search`, etc.

### 2. `frontend/src/services/groupService.ts`
- ✅ Removido prefixo `/api` de todas as URLs
- ✅ URLs agora corretas: `/groups`, `/groups/user/${userId}`, etc.
- ✅ Corrigido import para usar `UserGroupData`

### 3. `frontend/src/services/messageService.ts`
- ✅ Removido prefixo `/api` de todas as URLs
- ✅ URLs agora corretas: `/messages`, `/messages/received`, etc.

### 4. `frontend/src/pages/Clientes.tsx`
- ✅ Corrigido `SelectItem` com `value="all"`
- ✅ Atualizada lógica de filtros para usar `"all"`
- ✅ Corrigido tipo do estado `statusFilter`

## URLs Corrigidas

### ClientService
| Antes | Depois |
|-------|--------|
| `/api/clients` | `/clients` |
| `/api/clients/search` | `/clients/search` |
| `/api/clients/status/${status}` | `/clients/status/${status}` |
| `/api/clients/${id}` | `/clients/${id}` |
| `/api/clients/cnpj/${cnpj}` | `/clients/cnpj/${cnpj}` |

### GroupService
| Antes | Depois |
|-------|--------|
| `/api/groups` | `/groups` |
| `/api/groups/${id}` | `/groups/${id}` |
| `/api/groups/user/${userId}` | `/groups/user/${userId}` |
| `/api/groups/user/${userId}/permissions` | `/groups/user/${userId}/permissions` |

### MessageService
| Antes | Depois |
|-------|--------|
| `/api/messages` | `/messages` |
| `/api/messages/received` | `/messages/received` |
| `/api/messages/sent` | `/messages/sent` |
| `/api/messages/unread` | `/messages/unread` |

## Como Testar

### 1. Teste da API de Clientes
```
http://localhost:8080/clientes
```
- ✅ Deve carregar sem erro 500
- ✅ Select de filtros deve funcionar
- ✅ Paginação deve funcionar

### 2. Teste da API de Grupos
```
Login como SUPER_ADMIN
```
- ✅ Não deve mostrar erro de grupos
- ✅ Deve continuar funcionando sem grupos
- ✅ Logs devem mostrar "Continuando sem grupos"

### 3. Teste do Select
```
Página de Clientes → Filtro de Status
```
- ✅ Deve abrir sem erro
- ✅ "Todos os status" deve funcionar
- ✅ Filtros individuais devem funcionar

## Status Atual

✅ **Erro 500 na API de clientes corrigido**
✅ **Erro 500 na API de grupos tratado**
✅ **Erro do Select.Item corrigido**
✅ **URLs da API corrigidas**
✅ **Lógica de filtros atualizada**
✅ **Todos os services atualizados**

## Próximos Passos

1. Testar todas as páginas que usam API
2. Verificar se há outros services com URLs duplicadas
3. Implementar tratamento de erro mais robusto
4. Adicionar loading states adequados
5. Considerar implementar retry automático para falhas de rede 