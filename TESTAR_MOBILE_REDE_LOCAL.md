# 📱 Como Testar Mobile na Rede Local

## 🎯 **Objetivo:**

Testar a responsividade mobile do PWA usando seu celular conectado à mesma rede Wi-Fi do PC.

---

## 🔧 **Passo a Passo:**

### **1. Descobrir IP do seu PC**

**Windows (PowerShell):**
```powershell
ipconfig | Select-String "IPv4"
```

Procure por algo como: `192.168.1.116` (seu IP atual)

### **2. Criar arquivo .env.local**

**No diretório `frontend/`, crie o arquivo `.env.local`:**

```bash
# frontend/.env.local
VITE_API_URL=http://192.168.1.116:8081/api
VITE_WS_URL=ws://192.168.1.116:8081/ws
VITE_ENVIRONMENT=local
VITE_DEBUG=true
```

**⚠️ IMPORTANTE**: Substitua `192.168.1.116` pelo IP do seu PC!

### **3. Verificar Firewall do Windows**

O backend precisa aceitar conexões externas. Execute como Administrador:

```powershell
# Permitir porta 8081 no Firewall
New-NetFirewallRule -DisplayName "SecuredGuard Backend" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow

# Permitir porta 3000 no Firewall
New-NetFirewallRule -DisplayName "SecuredGuard Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### **4. Reiniciar Frontend**

```bash
cd frontend
npm run dev
```

**Você verá algo como:**
```
VITE v5.x ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.116:3000/
```

### **5. Verificar Backend**

Certifique-se que o backend está rodando:

```bash
cd backend
./mvnw spring-boot:run
```

**Backend deve estar** em: `http://localhost:8081`

### **6. Testar do Celular**

**No celular, acesse:**
```
http://192.168.1.116:3000
```

**Credenciais:**
- Username: `jose.ramos`
- Password: `Admin1234`

---

## 🔍 **Troubleshooting:**

### **Problema 1: "Cannot reach server"**
**Causa**: Firewall bloqueando
**Solução**: Execute os comandos do Passo 3

### **Problema 2: "Erro de CORS"**
**Causa**: Backend não aceita origem
**Solução**: CORS já está configurado para `*`, deve funcionar

### **Problema 3: "localhost connection refused"**
**Causa**: `.env.local` não foi criado ou frontend não foi reiniciado
**Solução**: 
1. Verifique se `.env.local` existe
2. Reinicie frontend (`npm run dev`)
3. Confirme que mostra "Network: http://192.168.1.116:3000/"

### **Problema 4: "Invalid credentials"**
**Causa**: Backend não está rodando ou não está acessível
**Solução**:
1. Verifique se backend está rodando
2. Teste do PC: `curl http://localhost:8081/api/health`
3. Teste do celular: `http://192.168.1.116:8081/api/health` (no browser)

---

## 📊 **Checklist:**

- [ ] Descobrir IP do PC (`ipconfig`)
- [ ] Criar `frontend/.env.local` com IP correto
- [ ] Configurar Firewall (portas 3000 e 8081)
- [ ] Reiniciar frontend (`npm run dev`)
- [ ] Verificar backend está rodando
- [ ] Acessar `http://SEU_IP:3000` no celular
- [ ] Fazer login e testar responsividade

---

## 🎯 **Após Funcionar Local:**

1. **Teste todas as páginas** no celular
2. **Verifique responsividade**:
   - ✅ Header compacto
   - ✅ Menu hamburger
   - ✅ Textos não truncados
   - ✅ Ícones não cortados
   - ✅ Touch targets adequados

3. **Faça o commit** das melhorias de responsividade
4. **Deploy para CI** (testa ambiente remoto)
5. **Teste no celular via CI**: `https://ci.z7botsolutions.com.br`

---

## ⚡ **Atalho Rápido:**

**Se não quiser configurar firewall**, apenas teste direto no CI:

```
https://ci.z7botsolutions.com.br
```

Lá já está tudo configurado e funciona perfeitamente do celular!

---

## 🚀 **Próximos Passos:**

1. **Agora**: Configurar ambiente local (10 min)
2. **Testar**: Mobile no local (5 min)
3. **Commit**: Melhorias de responsividade (2 min)
4. **Deploy**: CI e testar remoto (15 min)
5. **Total**: ~30 minutos para testes completos

**Siga os passos acima e conseguirá testar no celular!** 📱🚀
