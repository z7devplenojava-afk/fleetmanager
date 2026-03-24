# Correção: Visualização de Holerites para Colaboradores

## 🎯 Problema Resolvido

Colaboradores não conseguiam visualizar seus holerites na página "Meus Holerites", mesmo que aparecessem no Dashboard.

## 🔧 Alterações Realizadas

### 1. **AuthContext.tsx**
Adicionado o campo `username` (CPF) ao objeto User durante o login:

```typescript
const userData: User = {
  // ... outros campos
  username: response.data.user?.username || email, // CPF usado no login
  // ... resto dos campos
};
```

### 2. **holeriteService.ts**
Modificado `getAllHolerites()` para filtrar por CPF quando o usuário for COLABORADOR:

```typescript
async getAllHolerites(): Promise<Holerite[]> {
  // Verificar se é um colaborador e filtrar por CPF
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    
    // Se for COLABORADOR, filtrar por CPF (username é o CPF)
    if (user.role === 'COLABORADOR' && user.username) {
      const response = await api.get(`/payslips?cpf=${user.username}`);
      return response.data;
    }
  }
  
  // Para outros roles, buscar todos
  const response = await api.get('/payslips');
  return response.data;
}
```

### 3. **payslipService.ts**
Modificado `getAllPayslips()` para filtrar por CPF quando o usuário for COLABORADOR:

```typescript
async getAllPayslips(): Promise<Payslip[]> {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    
    if (user.role === 'COLABORADOR' && user.username) {
      return this.getPayslips({ cpf: user.username });
    }
  }
  
  return this.getPayslips();
}
```

### 4. **receiptService.ts**
Modificado `getAllReceipts()` para filtrar por CPF quando o usuário for COLABORADOR:

```typescript
async getAllReceipts(): Promise<Receipt[]> {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    
    if (user.role === 'COLABORADOR' && user.username) {
      const response = await api.get(`/receipts?cpf=${user.username}`);
      return response.data;
    }
  }
  
  const response = await api.get('/receipts');
  return response.data;
}
```

### 5. **unifiedDocumentService.ts**
Modificado `getAllUnifiedDocuments()` para filtrar por CPF quando o usuário for COLABORADOR:

```typescript
async getAllUnifiedDocuments(): Promise<UnifiedDocument[]> {
  const userStr = localStorage.getItem('user');
  let cpfParam = '';
  
  if (userStr) {
    const user = JSON.parse(userStr);
    
    if (user.role === 'COLABORADOR' && user.username) {
      cpfParam = `?cpf=${user.username}`;
    }
  }
  
  const response = await api.get(`/unified-documents/list${cpfParam}`);
  // ... resto do código
}
```

## ✅ Como Funciona Agora

1. **Login:** O CPF do usuário é salvo no campo `username` do objeto User
2. **Busca de Documentos:** Quando um COLABORADOR busca documentos:
   - O serviço verifica o role do usuário
   - Se for COLABORADOR, adiciona o parâmetro `?cpf={username}` na URL
   - O backend filtra e retorna apenas os documentos daquele CPF
3. **Outros Roles:** Administradores, RH, etc. continuam vendo todos os documentos

## 🔒 Segurança

**Importante:** Esta é uma solução temporária no frontend. Para segurança completa, o backend deve:

1. Extrair o CPF do token JWT
2. Filtrar automaticamente os documentos por CPF para COLABORADORES
3. Não confiar no parâmetro `cpf` enviado pelo frontend

## 🧪 Como Testar

1. Faça login como COLABORADOR (usando CPF)
2. Acesse "Meus Holerites" no menu
3. Verifique se os holerites aparecem corretamente
4. Tente baixar um holerite
5. Verifique também:
   - Dashboard (deve mostrar os mesmos holerites)
   - Comprovantes
   - Documentos Unificados

## 📝 Logs de Debug

Os serviços agora incluem logs para facilitar o debug:

```
👤 Usuário logado: ALINE GONSALVES PEREIRA Role: COLABORADOR
🔒 Filtrando holerites por CPF: 12345678900
✅ Holerites do colaborador carregados: 1
```

## 🚀 Próximos Passos

1. [ ] Implementar filtro automático no backend (recomendado)
2. [ ] Adicionar testes automatizados
3. [ ] Verificar se outros endpoints precisam do mesmo filtro
4. [ ] Adicionar campo `cpf` explícito no tipo User (opcional)

## 📚 Arquivos Modificados

- `src/contexts/AuthContext.tsx`
- `src/services/holeriteService.ts`
- `src/services/payslipService.ts`
- `src/services/receiptService.ts`
- `src/services/unifiedDocumentService.ts`

## 🐛 Problemas Conhecidos

- Se o backend não suportar o parâmetro `?cpf=`, a busca pode retornar vazio
- Se o `username` não for o CPF, o filtro não funcionará
- Colaboradores podem tentar manipular o CPF no localStorage (por isso o backend deve validar)
