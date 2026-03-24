# 🧪 Guia Postman - Documentos Unificados CI

## 📋 **Como Importar e Usar**

### **1. Importar Coleção no Postman**
1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo `postman_unified_documents_ci.json`
4. A coleção será importada com todas as requisições

### **2. Variáveis Configuradas**
- **BASE_URL**: `https://ci.z7botsolutions.com.br/api`
- **TOKEN**: Será preenchido automaticamente após login

---

## 🔄 **Sequência de Testes Recomendada**

### **Fase 1: Verificação Básica**

#### **1. Health Check**
```
GET {{BASE_URL}}/health
```
**Resultado esperado**: `200 OK` com status "UP"

#### **2. Login Admin (se disponível)**
```
POST {{BASE_URL}}/auth/login
Body: {
  "username": "admin",
  "password": "admin123"
}
```

### **Fase 2: Teste de Usuário COLABORADOR**

#### **3. Registrar Usuário COLABORADOR**
```
POST {{BASE_URL}}/auth/register
Body: {
  "username": "12345678901",
  "password": "12345678901@2025",
  "email": "colaborador@test.com",
  "fullName": "Colaborador Teste",
  "roles": ["ROLE_COLABORADOR"]
}
```

#### **4. Login COLABORADOR**
```
POST {{BASE_URL}}/auth/login
Body: {
  "username": "12345678901",
  "password": "12345678901@2025"
}
```
**Nota**: O token será salvo automaticamente na variável `{{TOKEN}}`

### **Fase 3: Teste de Endpoints Protegidos**

#### **5. Documentos Unificados (Protegido)**
```
GET {{BASE_URL}}/unified-documents/list
Headers: Authorization: Bearer {{TOKEN}}
```
**Resultado esperado**: 
- ✅ `200 OK` (se permissões aplicadas)
- ❌ `403 Forbidden` (se ainda não aplicadas)

#### **6. Payslips (Protegido)**
```
GET {{BASE_URL}}/payslips
Headers: Authorization: Bearer {{TOKEN}}
```

#### **7. Receipts (Protegido)**
```
GET {{BASE_URL}}/receipts
Headers: Authorization: Bearer {{TOKEN}}
```

### **Fase 4: Teste de Endpoints Públicos**

#### **8. Documentos Unificados (Público)**
```
GET {{BASE_URL}}/unified-documents/public/list
```
**Resultado esperado**: `200 OK` sempre

#### **9. Documentos Detalhados (Público)**
```
GET {{BASE_URL}}/unified-documents/public/list-detailed
```

---

## 📊 **Interpretação dos Resultados**

### **✅ Cenários de Sucesso**

| Endpoint | Status | Significado |
|----------|--------|-------------|
| `/health` | 200 | Backend funcionando |
| `/auth/login` | 200 | Autenticação OK |
| `/unified-documents/list` | 200 | Permissões aplicadas ✅ |
| `/unified-documents/public/list` | 200 | Endpoint público OK |

### **⚠️ Cenários Esperados (Temporários)**

| Endpoint | Status | Significado |
|----------|--------|-------------|
| `/unified-documents/list` | 403 | Aguardando deploy das permissões |
| `/payslips` | 403 | Aguardando deploy das permissões |
| `/receipts` | 403 | Aguardando deploy das permissões |

### **❌ Cenários de Erro**

| Endpoint | Status | Ação |
|----------|--------|-------|
| `/health` | 500/timeout | Backend com problema |
| `/auth/login` | 401 | Credenciais incorretas |
| `/unified-documents/public/list` | 500 | Problema no serviço |

---

## 🎯 **Testes Específicos para Documentos Unificados**

### **Teste 1: Verificar se há dados**
```
GET {{BASE_URL}}/unified-documents/public/list
```
**Resposta esperada**:
```json
{
  "total": 0,
  "documents": [],
  "mensagem": "Documentos unificados listados com sucesso",
  "sucesso": true
}
```

### **Teste 2: Debug de dados (se autorizado)**
```
GET {{BASE_URL}}/unified-documents/debug-data
Headers: Authorization: Bearer {{TOKEN}}
```

### **Teste 3: Criar documento teste (se autorizado)**
```
POST {{BASE_URL}}/unified-documents/create?employeeName=TESTE&month=10&year=2025
Headers: Authorization: Bearer {{TOKEN}}
```

---

## 🔧 **Troubleshooting**

### **Problema: 403 em todos endpoints protegidos**
**Causa**: Deploy das permissões ainda não aplicado
**Solução**: Aguardar GitHub Actions completar

### **Problema: 401 Unauthorized**
**Causa**: Token inválido ou expirado
**Solução**: Fazer login novamente (request #4)

### **Problema: Lista vazia de documentos**
**Causa**: Não há dados no ambiente CI (normal)
**Solução**: Importar holerites e comprovantes primeiro

### **Problema: 500 Internal Server Error**
**Causa**: Erro no backend
**Solução**: Verificar logs do servidor

---

## 📝 **Notas Importantes**

1. **Ordem dos testes**: Execute na sequência numerada
2. **Token automático**: Será salvo após login bem-sucedido
3. **Ambiente CI**: Pode estar vazio (sem dados)
4. **Permissões**: Podem estar pendentes de deploy
5. **Fallback**: Frontend usa endpoint público se protegido falhar

---

## 🚀 **Comandos Rápidos**

### **Teste Rápido de Status**
```bash
# Health Check
curl https://ci.z7botsolutions.com.br/api/health

# Documentos Públicos
curl https://ci.z7botsolutions.com.br/api/unified-documents/public/list
```

### **Login via cURL**
```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"12345678901","password":"12345678901@2025"}'
```
