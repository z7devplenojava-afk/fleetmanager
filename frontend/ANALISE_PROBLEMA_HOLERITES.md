# Análise: Problema de Visualização de Holerites

## 🔍 Problema Identificado

O usuário logado como **COLABORADOR** não consegue visualizar seus holerites na página "Meus Holerites", mesmo que eles apareçam no Dashboard.

## 📊 Evidências

### Dashboard (Funcionando)
- Mostra "1 holerite disponível"
- Exibe o holerite de Setembro/2025
- Permite download

### Página Meus Holerites (Não Funcionando)
- Mostra "Nenhum holerite encontrado"
- Não exibe nenhum documento

## 🔎 Causa Raiz

### 1. **Serviços Diferentes**

**DashboardColaborador.tsx** usa:
```typescript
payslipService.getAllPayslips()  // Endpoint: GET /payslips
```

**MeusHolerites.tsx** usa:
```typescript
holeriteService.getAllHolerites()  // Endpoint: GET /payslips
```

Ambos chamam o mesmo endpoint `/payslips`, mas podem ter comportamentos diferentes.

### 2. **Falta de Filtro por CPF/Usuário**

O problema principal é que **nenhum dos serviços está enviando o CPF do usuário logado** para filtrar os holerites.

#### No AuthContext:
- O usuário tem `username` (que é o CPF usado no login)
- Mas não há um campo `cpf` explícito no objeto `User`

#### Nos Serviços:
```typescript
// payslipService.ts
async getAllPayslips(): Promise<Payslip[]> {
  return this.getPayslips();  // ← Sem filtros!
}

// holeriteService.ts
async getAllHolerites(): Promise<Holerite[]> {
  const response = await api.get('/payslips');  // ← Sem filtros!
  return response.data;
}
```

### 3. **Backend Não Filtra Automaticamente**

O backend **deveria** filtrar automaticamente os holerites baseado no usuário autenticado (via token JWT), mas aparentemente isso não está acontecendo.

## ✅ Soluções Propostas

### Solução 1: Backend Filtra Automaticamente (RECOMENDADO)

O backend deve extrair o CPF do token JWT e filtrar automaticamente:

```java
@GetMapping("/payslips")
public ResponseEntity<List<Payslip>> getPayslips(Authentication authentication) {
    String cpf = authentication.getName(); // CPF do token
    String role = authentication.getAuthorities().toString();
    
    // Se for COLABORADOR, filtra apenas seus holerites
    if (role.contains("COLABORADOR")) {
        return payslipService.findByCpf(cpf);
    }
    
    // Outros roles veem todos
    return payslipService.findAll();
}
```

**Vantagens:**
- ✅ Segurança: Colaborador nunca pode ver holerites de outros
- ✅ Simples: Frontend não precisa mudar
- ✅ Consistente: Funciona em todas as páginas

### Solução 2: Frontend Envia CPF (TEMPORÁRIA)

Modificar os serviços para enviar o CPF do usuário:

```typescript
// holeriteService.ts
async getAllHolerites(): Promise<Holerite[]> {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const cpf = user.username; // CPF está no username
  
  if (user.role === 'COLABORADOR' && cpf) {
    const response = await api.get(`/payslips?cpf=${cpf}`);
    return response.data;
  }
  
  const response = await api.get('/payslips');
  return response.data;
}
```

**Desvantagens:**
- ❌ Menos seguro: Colaborador pode manipular o CPF
- ❌ Duplicação: Precisa fazer em todos os serviços
- ❌ Inconsistente: Fácil esquecer em novos endpoints

### Solução 3: Adicionar Campo CPF no User

Adicionar o campo `cpf` explicitamente no objeto User:

```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;  // ← NOVO
  username?: string;
  // ... resto dos campos
}

// AuthContext.tsx - no login
const userData: User = {
  id: response.data.user?.id,
  name: response.data.user?.fullName,
  email: response.data.user?.email,
  cpf: response.data.user?.cpf || email, // ← NOVO
  username: email,
  // ... resto dos campos
};
```

## 🎯 Recomendação Final

**Implementar Solução 1 (Backend) + Solução 3 (Frontend)**

1. **Backend:** Filtrar automaticamente por CPF baseado no token JWT
2. **Frontend:** Adicionar campo `cpf` no User para facilitar uso futuro
3. **Validação:** Garantir que COLABORADOR só vê seus próprios holerites

## 🔧 Próximos Passos

1. [ ] Verificar se o backend já tem o filtro implementado
2. [ ] Se não, implementar filtro no backend
3. [ ] Adicionar campo `cpf` no tipo User
4. [ ] Testar com usuário COLABORADOR
5. [ ] Verificar se outros endpoints têm o mesmo problema

## 📝 Observações

- O problema afeta **apenas COLABORADORES**
- Outros roles (ADMIN, RH, etc.) provavelmente veem todos os holerites
- O mesmo problema pode existir em outros endpoints (comprovantes, documentos unificados)
