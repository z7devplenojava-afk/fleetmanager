# 🌐 Configuração de Acesso na Rede Local

## 🎯 Objetivo
Permitir que outros computadores na mesma rede acessem o sistema usando o IP local (ex: `http://192.168.1.116:3000`)

---

## ✅ **Configuração Atual (Já está OK):**

O `vite.config.ts` já está configurado corretamente:
```typescript
server: {
  host: "::",  // ✅ Aceita conexões de qualquer IP
  port: 3000,
  // ...
}
```

---

## 🔧 **Solução: Liberar Firewall do Windows**

### **Método 1: PowerShell (Mais Rápido) ⚡**

Execute como **Administrador**:

```powershell
# Liberar porta 3000 (Frontend)
New-NetFirewallRule -DisplayName "Vite Dev Server (3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Liberar porta 8081 (Backend - Spring Boot)
New-NetFirewallRule -DisplayName "Spring Boot Backend (8081)" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
```

**Pronto!** Agora deve funcionar. ✅

---

### **Método 2: Interface Gráfica do Windows 🖱️**

#### **Passo 1: Abrir Firewall**
1. Pressione `Win + R`
2. Digite: `wf.msc`
3. Pressione Enter

#### **Passo 2: Criar Regra de Entrada**
1. Clique em **"Regras de Entrada"** (lado esquerdo)
2. Clique em **"Nova Regra..."** (lado direito)

#### **Passo 3: Configurar Regra para Porta 3000**
1. **Tipo de Regra:** Selecione **"Porta"** → Avançar
2. **Protocolo:** Selecione **"TCP"**
3. **Portas:** Digite **"3000"** → Avançar
4. **Ação:** Selecione **"Permitir a conexão"** → Avançar
5. **Perfil:** Marque **"Domínio", "Particular" e "Público"** → Avançar
6. **Nome:** Digite **"Vite Dev Server - Frontend"** → Concluir

#### **Passo 4: Repetir para Porta 8081 (Backend)**
Repita os passos acima, mas:
- Digite porta **"8081"**
- Nome: **"Spring Boot Backend"**

---

## 🧪 **Testando a Configuração:**

### **1. Descobrir seu IP local:**

```powershell
ipconfig
```

Procure por **"Endereço IPv4"** (ex: `192.168.1.116`)

### **2. Testar no próprio PC:**

```
http://localhost:3000        ✅ Frontend
http://localhost:8081/api    ✅ Backend
```

### **3. Testar de outro PC na rede:**

```
http://192.168.1.116:3000        ✅ Frontend
http://192.168.1.116:8081/api    ✅ Backend
```

---

## ⚠️ **Problema Adicional: Backend também precisa aceitar conexões externas**

### **Verificar configuração do Spring Boot:**

Arquivo: `backend/src/main/resources/application.properties`

```properties
# Deve ter:
server.port=8081
server.address=0.0.0.0  # ← Aceita conexões de qualquer IP
```

**Se não tiver `server.address`, adicione:**

```properties
server.address=0.0.0.0
```

---

## 🔄 **Atualizar Frontend para usar IP dinâmico:**

### **Problema:**
O proxy do Vite está configurado para `localhost:8081`, então quando você acessa de outro PC, ele não encontra o backend.

### **Solução: Criar arquivo `.env.local`**

Crie o arquivo `frontend/.env.local`:

```env
VITE_API_URL=http://192.168.1.116:8081
```

E atualize o código para usar essa variável:

**Arquivo: `frontend/src/lib/axios.ts`** (ou onde o axios é configurado)
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  // ...
});
```

---

## 📋 **Checklist Completo:**

### **No PC que roda o servidor:**

- [ ] Firewall liberado para porta **3000**
- [ ] Firewall liberado para porta **8081**
- [ ] Backend rodando em `0.0.0.0:8081`
- [ ] Frontend rodando em `[::]:3000`
- [ ] IP local descoberto (ex: `192.168.1.116`)

### **No PC cliente:**

- [ ] Consegue fazer ping: `ping 192.168.1.116`
- [ ] Acessa frontend: `http://192.168.1.116:3000`
- [ ] API funciona: `http://192.168.1.116:8081/api`

---

## 🐛 **Troubleshooting:**

### **1. Erro: "Este site não pode ser acessado"**

**Causa:** Firewall bloqueando ou servidor não rodando

**Solução:**
```powershell
# Ver se algum processo está usando a porta
netstat -ano | findstr "3000"
netstat -ano | findstr "8081"
```

### **2. Erro: "ERR_CONNECTION_REFUSED"**

**Causa:** Porta está fechada ou servidor parou

**Solução:**
1. Verificar se os processos estão rodando
2. Reiniciar frontend: `npm run dev`
3. Reiniciar backend

### **3. Frontend abre mas API não funciona**

**Causa:** Backend não está acessível externamente

**Solução:**
1. Verificar `server.address=0.0.0.0` no backend
2. Liberar porta 8081 no firewall
3. Reiniciar o backend

### **4. Funciona só no PC local**

**Causa:** Firewall bloqueando conexões externas

**Solução:**
```powershell
# Verificar regras do firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*3000*"}
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*8081*"}
```

### **5. IP mudou depois de reiniciar**

**Causa:** DHCP atribuiu novo IP

**Solução:**
- Use IP estático no roteador
- Ou sempre verifique o IP atual com `ipconfig`

---

## 🚀 **Comandos Rápidos:**

### **Liberar tudo de uma vez (PowerShell Admin):**
```powershell
# Frontend
New-NetFirewallRule -DisplayName "Secured Guard Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Backend
New-NetFirewallRule -DisplayName "Secured Guard Backend" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow

# Confirmar
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Secured Guard*"}
```

### **Remover regras (se precisar):**
```powershell
Remove-NetFirewallRule -DisplayName "Secured Guard Frontend"
Remove-NetFirewallRule -DisplayName "Secured Guard Backend"
```

### **Ver IP rapidamente:**
```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Ethernet*" -or $_.InterfaceAlias -like "*Wi-Fi*"}).IPAddress
```

---

## 📱 **Acessar de Celular na mesma WiFi:**

Mesmo procedimento! Use o IP no navegador do celular:

```
http://192.168.1.116:3000
```

✅ **Funciona perfeitamente!**

---

## 🔒 **Segurança:**

⚠️ **ATENÇÃO:** Isso libera acesso na sua **rede local** apenas.

- ✅ **Seguro** para desenvolvimento em casa/escritório
- ❌ **NÃO USAR** em produção
- ❌ **NÃO EXPOR** diretamente na internet

Para produção, use:
- Nginx como proxy reverso
- HTTPS com certificado SSL
- Autenticação robusta
- Rate limiting
- Firewall de aplicação (WAF)

---

## ✨ **Configuração Alternativa: Usando IP em vez de localhost**

Se preferir, pode alterar o script de dev:

**`frontend/package.json`:**
```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",  // ← Aceita todas as interfaces
    // ou
    "dev": "vite --host 192.168.1.116"  // ← IP específico
  }
}
```

---

## 📞 **Precisa de Ajuda?**

Após liberar o firewall, teste:

1. ✅ Acesse de outro PC: `http://SEU_IP:3000`
2. ✅ Verifique o console do navegador (F12)
3. ✅ Veja os logs do backend

Se ainda não funcionar, me informe qual erro específico aparece! 🔧

