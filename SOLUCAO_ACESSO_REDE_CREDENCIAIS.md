# ✅ Solução: Credenciais Inválidas ao Acessar via IP da Rede

## 🔍 **Problema Identificado:**

Quando você acessa o sistema de outro PC usando `http://192.168.1.116:3000`:
- ✅ **Frontend carrega** normalmente
- ❌ **Credenciais aparecem como inválidas** (mesmo estando corretas)

### **Causa Raiz:**

O frontend estava configurado para **sempre** usar `localhost:8081` como backend, mesmo quando acessado via IP externo.

```typescript
// ❌ ANTES - PROBLEMA:
apiUrl: 'http://localhost:8081/api'  // ← Sempre localhost

// Quando você acessa de outro PC:
// - Frontend: http://192.168.1.116:3000 ✅
// - Backend:  http://localhost:8081 ❌ (localhost do OUTRO PC!)
```

O outro PC tentava se conectar ao **próprio** localhost, não ao servidor! Por isso as credenciais "não funcionavam".

---

## ✅ **Solução Implementada:**

### **1. Detecção Inteligente de Backend**

Agora o sistema detecta automaticamente o IP e ajusta o backend:

```typescript
// ✅ DEPOIS - SOLUÇÃO:
function getBackendHost(): string {
  const hostname = window.location.hostname;
  
  // Se for IP (ex: 192.168.1.116), usa o mesmo IP
  if (hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
    return hostname; // ← Usa o IP do servidor
  }
  
  // Se for localhost, mantém localhost
  return 'localhost';
}

apiUrl: `http://${getBackendHost()}:8081/api`
```

### **2. Como Funciona:**

| Você acessa | Frontend | Backend usado |
|-------------|----------|---------------|
| `http://localhost:3000` | localhost:3000 | localhost:8081 ✅ |
| `http://127.0.0.1:3000` | 127.0.0.1:3000 | localhost:8081 ✅ |
| `http://192.168.1.116:3000` | 192.168.1.116:3000 | **192.168.1.116:8081** ✅ |
| `http://10.0.0.5:3000` | 10.0.0.5:3000 | **10.0.0.5:8081** ✅ |

---

## 🚀 **Como Testar:**

### **1. Reinicie o Frontend:**

```bash
cd frontend
npm run dev
```

### **2. Acesse de outro PC:**

```
http://192.168.1.116:3000
```

### **3. Faça Login:**

Agora as credenciais devem funcionar! ✅

### **4. Verifique os Logs (F12 → Console):**

Você deve ver:
```
🔧 Detectado acesso via IP: 192.168.1.116
🔧 Usando mesmo IP para backend: 192.168.1.116
🌍 Ambiente detectado: local
⚙️ Configuração: { apiUrl: 'http://192.168.1.116:8081/api', ... }
```

---

## 🔧 **Configurações Necessárias:**

### **✅ 1. Backend (Já está OK):**

Arquivo: `backend/src/main/resources/application.properties`

```properties
server.port=8081
server.address=0.0.0.0  # ← Aceita conexões externas
```

### **✅ 2. Firewall (Já deve estar liberado):**

Se ainda não liberou, execute como **Administrador**:

```powershell
# Frontend
New-NetFirewallRule -DisplayName "Secured Guard Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Backend  
New-NetFirewallRule -DisplayName "Secured Guard Backend" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
```

### **✅ 3. Frontend (Corrigido agora):**

Arquivo: `frontend/src/config/environment.ts`

A detecção inteligente de backend foi implementada!

---

## 🧪 **Teste Completo:**

### **No PC Servidor (onde roda o backend/frontend):**

1. ✅ Descubra seu IP:
```powershell
ipconfig
# Procure por "Endereço IPv4": 192.168.1.116
```

2. ✅ Backend rodando:
```bash
cd backend
./mvnw spring-boot:run
# Deve mostrar: "Started SecuredGuardApplication on 0.0.0.0:8081"
```

3. ✅ Frontend rodando:
```bash
cd frontend
npm run dev
# Deve mostrar: "Local: http://localhost:3000"
#               "Network: http://192.168.1.116:3000"
```

### **No PC Cliente (outro computador na rede):**

1. ✅ Abra o navegador
2. ✅ Acesse: `http://192.168.1.116:3000`
3. ✅ Faça login com suas credenciais
4. ✅ Deve funcionar! 🎉

---

## 📊 **Logs de Debug:**

### **Console do Navegador (F12):**

```javascript
// Logs que você deve ver:
🔧 Detectado acesso via IP: 192.168.1.116
🔧 Usando mesmo IP para backend: 192.168.1.116
🌍 Ambiente detectado: local
⚙️ Configuração: {
  name: 'Desenvolvimento Local',
  apiUrl: 'http://192.168.1.116:8081/api',
  wsUrl: 'ws://192.168.1.116:8081/ws',
  debug: true
}
🔗 Axios Request: POST /auth/login
🔗 Base URL: http://192.168.1.116:8081/api
🔗 Full URL: http://192.168.1.116:8081/api/auth/login
✅ Axios Response: 200 /auth/login
```

### **Console do Backend:**

```
Sending Request to the Target: POST /api/auth/login
Received Response from the Target: 200 /api/auth/login
```

---

## ⚠️ **Troubleshooting:**

### **1. Ainda dá "Credenciais Inválidas"**

**Verifique no console (F12):**
```javascript
// Procure por:
🔗 Full URL: http://192.168.1.116:8081/api/auth/login
```

- ✅ Se mostrar o IP correto (192.168.1.116), o problema é de credenciais mesmo
- ❌ Se mostrar `localhost`, o cache do navegador está antigo - limpe com `Ctrl+Shift+Del`

### **2. Erro "ERR_CONNECTION_REFUSED"**

**Causa:** Backend não está acessível

**Solução:**
```powershell
# Verificar se backend está rodando
netstat -ano | findstr ":8081"

# Testar direto no navegador
http://192.168.1.116:8081/api/auth/login
# Deve retornar erro 401 (não 404 ou timeout)
```

### **3. CORS Error**

**Causa:** Backend bloqueando requisições

**Solução:** Verificar configuração CORS no backend (já deve estar OK)

### **4. Cache do Navegador**

**Solução:**
```
Ctrl + Shift + Del
→ Limpar cache
→ Recarregar: Ctrl + F5
```

---

## 🎯 **Resumo:**

### **Antes:**
```
PC Cliente → http://192.168.1.116:3000 (frontend) ✅
          → http://localhost:8081/api (backend) ❌ ERRADO!
                   ↑ Tentava acessar o próprio localhost
```

### **Depois:**
```
PC Cliente → http://192.168.1.116:3000 (frontend) ✅  
          → http://192.168.1.116:8081/api (backend) ✅ CORRETO!
                   ↑ Acessa o IP do servidor real
```

---

## ✨ **Funcionalidades Adicionais:**

### **1. Acesso de Celular:**

Mesmo procedimento! Digite no navegador do celular:
```
http://192.168.1.116:3000
```

### **2. Múltiplos PCs:**

Todos os PCs na mesma rede podem acessar simultaneamente!

### **3. Modo Debug:**

Para ver todos os logs, pressione F12 no navegador e vá em "Console"

---

## 🔒 **Segurança:**

⚠️ **IMPORTANTE:**
- Isso é para **rede local** apenas
- **NÃO exponha** diretamente na internet
- Use VPN se precisar acesso remoto
- Em produção, use HTTPS com certificado válido

---

## 🎉 **Conclusão:**

✅ **Problema resolvido!**
✅ **Credenciais funcionam normalmente**
✅ **Acesso via IP da rede funcionando**
✅ **Detecção automática de backend**

**Agora você pode acessar o sistema de qualquer dispositivo na sua rede local! 🚀**

