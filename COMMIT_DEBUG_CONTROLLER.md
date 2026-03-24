# 🔧 Commit do Controller de Debug

## 📋 **Arquivos Alterados**

1. **`backend/src/main/java/com/z7design/secured_guard/controller/DebugController.java`** - NOVO
2. **`backend/src/main/java/com/z7design/secured_guard/config/SecurityConfig.java`** - MODIFICADO

## 🚀 **Comandos para Executar**

### **1. Adicionar e Commitar**
```bash
git add .
git commit -m "debug: Adicionar controller de debug para investigar permissoes"
```

### **2. Push para CI (Dispara Deploy Automático)**
```bash
git push origin ci
```

## 🎯 **O que o Debug Controller Faz**

### **Endpoint 1: `/api/debug/auth`**
- ✅ **Público** (sem autenticação)
- 📋 **Retorna**: username, authorities, status de autenticação

### **Endpoint 2: `/api/debug/permissions`**
- ✅ **Público** (sem autenticação) 
- 📋 **Retorna**: permissões específicas (PAYSLIPS_READ, SUPER_ADMIN, COLABORADOR)

## 🧪 **Como Testar Após Deploy**

### **1. Teste Sem Login**
```bash
curl https://ci.z7botsolutions.com.br/api/debug/auth
```
**Resultado Esperado**: `{"authenticated": false, "username": "null", ...}`

### **2. Teste Com Login**
```bash
# 1. Fazer login
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}'

# 2. Usar token retornado
curl https://ci.z7botsolutions.com.br/api/debug/permissions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resultado Esperado**: 
```json
{
  "hasPayslipsRead": false,
  "hasSuperAdmin": true,
  "hasColaborador": false,
  "shouldAccessPayslips": true
}
```

## 🔍 **Diagnóstico Esperado**

Se `shouldAccessPayslips: true` mas `/api/payslips` ainda der 403, então:

1. **Problema na configuração das authorities**
2. **Problema no mapeamento de roles**
3. **Problema no JWT token**

## ⏱️ **Tempo Estimado**

- **Commit + Push**: 1 minuto
- **Deploy Automático**: 5-10 minutos
- **Teste**: 2 minutos
- **Total**: ~15 minutos

## 📊 **Próximos Passos**

1. ✅ **Executar comandos acima**
2. ⏳ **Aguardar deploy (5-10 min)**
3. 🧪 **Testar endpoints de debug**
4. 🔍 **Analisar resultados**
5. 🎯 **Identificar causa raiz do 403**
