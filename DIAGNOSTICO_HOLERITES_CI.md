# 🔍 Diagnóstico - Holerites no Ambiente CI

## 📋 **Problema Identificado**

**Erro**: `500 Internal Server Error` no endpoint `/unified-documents/create`
**Causa**: Não há **holerites** (payslips) no ambiente CI para criar documentos unificados

## ✅ **Status Atual Confirmado**

### **1. Backend Funcionando**
- ✅ Health Check: `200 OK`
- ✅ Login: `200 OK` com token válido
- ✅ Usuário: `jose.ramos` (SUPER_ADMIN)

### **2. Permissões Pendentes**
- ❌ `/api/payslips`: `403 Forbidden` (aguardando deploy)
- ❌ `/api/receipts`: `403 Forbidden` (aguardando deploy)
- ❌ `/api/unified-documents/list`: `403 Forbidden` (aguardando deploy)

### **3. Endpoints Públicos Funcionando**
- ✅ `/api/unified-documents/public/list`: `200 OK` (0 documentos)

---

## 🧪 **Requests Postman para Testar**

### **1. Login (Credenciais Corretas)**
```json
POST https://ci.z7botsolutions.com.br/api/auth/login
Content-Type: application/json

{
  "username": "jose.ramos",
  "password": "Admin1234"
}
```

### **2. Verificar Holerites (Após Deploy)**
```json
GET https://ci.z7botsolutions.com.br/api/payslips
Authorization: Bearer {TOKEN}
```
**Resultado Esperado**: `200 OK` com array (provavelmente vazio)

### **3. Verificar Comprovantes (Após Deploy)**
```json
GET https://ci.z7botsolutions.com.br/api/receipts
Authorization: Bearer {TOKEN}
```

### **4. Debug Dados Unificação (Após Deploy)**
```json
GET https://ci.z7botsolutions.com.br/api/unified-documents/debug-data
Authorization: Bearer {TOKEN}
```

### **5. Documentos Unificados (Público - Funciona Agora)**
```json
GET https://ci.z7botsolutions.com.br/api/unified-documents/public/list
```
**Resultado Atual**: `{"total": 0, "documents": [], "sucesso": true}`

---

## 🎯 **Próximos Passos**

### **Fase 1: Aguardar Deploy das Permissões**
1. **Aguardar** GitHub Actions completar (5-10 minutos)
2. **Testar** requests #2, #3, #4 acima
3. **Confirmar** que não há mais erro 403

### **Fase 2: Verificar Dados Existentes**
Após permissões funcionarem:
```bash
# Verificar se há holerites
GET /api/payslips → Deve retornar array (vazio ou com dados)

# Verificar se há comprovantes  
GET /api/receipts → Deve retornar array (vazio ou com dados)

# Debug completo
GET /api/unified-documents/debug-data → Mostra estatísticas
```

### **Fase 3: Adicionar Dados de Teste (Se Necessário)**

Se não houver dados, usar estes requests:

#### **Upload Holerite**
```json
POST https://ci.z7botsolutions.com.br/api/payslips/upload
Authorization: Bearer {TOKEN}
Content-Type: multipart/form-data

Form Data:
- file: [arquivo_holerite.pdf]
```

#### **Upload Comprovante**
```json
POST https://ci.z7botsolutions.com.br/api/receipts/upload
Authorization: Bearer {TOKEN}
Content-Type: multipart/form-data

Form Data:
- file: [arquivo_comprovante.pdf]
- employeeName: "MARIA SILVA TESTE"
- month: 10
- year: 2025
```

#### **Criar Documento Unificado**
```json
POST https://ci.z7botsolutions.com.br/api/unified-documents/create?employeeName=MARIA SILVA TESTE&month=10&year=2025
Authorization: Bearer {TOKEN}
```

---

## 🚨 **Diagnóstico do Erro 500**

### **Causa Mais Provável**
O erro 500 em `/unified-documents/create` acontece porque:

1. **Não há holerites** no sistema CI
2. **Não há comprovantes** no sistema CI  
3. **Service tenta buscar** dados que não existem
4. **Falha** ao tentar criar documento unificado

### **Código Provável do Erro**
```java
// UnifiedDocumentService.java
List<Payslip> payslips = payslipService.getAllPayslips(); // Lista vazia
PaymentReceipt receipt = findReceiptForEmployee(name, month, year); // null
// Tentativa de processar dados null/vazios → 500 Error
```

### **Solução**
1. **Aguardar** deploy das permissões
2. **Verificar** se há dados no sistema
3. **Adicionar** dados de teste se necessário
4. **Testar** criação de documento unificado

---

## 📊 **Status de Monitoramento**

| Componente | Status | Ação Necessária |
|------------|--------|-----------------|
| Backend | ✅ UP | Nenhuma |
| Login | ✅ OK | Nenhuma |
| Permissões | ❌ 403 | Aguardar deploy |
| Dados | ❓ Desconhecido | Verificar após deploy |
| Unificação | ❌ 500 | Aguardar dados |

---

## 🔧 **Comandos de Teste Rápido**

```bash
# Health Check
curl https://ci.z7botsolutions.com.br/api/health

# Login
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}'

# Documentos Públicos
curl https://ci.z7botsolutions.com.br/api/unified-documents/public/list
```

**Resultado Esperado**: Health OK, Login com token, Documentos com total=0
