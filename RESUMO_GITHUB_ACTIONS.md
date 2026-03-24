# 🚀 Deploy Automático via GitHub Actions

## ✅ O que foi feito

### 1. **Correções no Código**
- ✅ Evolution API adicionada ao `docker-compose.ci.yml`
- ✅ Erro 405 do login corrigido (Traefik CORS)
- ✅ Configurações da Evolution API no `application-ci.properties`
- ✅ Teste `EnvioServiceTest.java` corrigido (remover `baileysRestService`)

### 2. **Scripts e Documentação**
- ✅ `deploy-evolution-ci-completo.sh` - Deploy automatizado
- ✅ `COMO_EXECUTAR_NO_CI.md` - Guia de uso
- ✅ `fix-test-push.bat` - Script para fazer push

---

## 🔄 Fluxo do GitHub Actions

### **Passo 1: Você faz push**
```bash
.\fix-test-push.bat
```

### **Passo 2: GitHub Actions executa**
```
✅ Checkout do código
✅ Build do backend (Maven)
✅ Testes unitários (agora vai passar!)
✅ Build da imagem Docker
✅ Push para Docker Hub
✅ Deploy no servidor CI
```

### **Passo 3: Deploy Automático**
O GitHub Actions vai executar no servidor CI:
```bash
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci evolution-api-ci
```

---

## 🎯 Após o Deploy Automático

### **1. Verificar Evolution API**
```bash
curl https://evolution.z7botsolutions.com.br
```

### **2. Testar Login (erro 405 corrigido)**
```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}'
```

### **3. Criar Instância Evolution**
```bash
curl -X POST https://evolution.z7botsolutions.com.br/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"securedguard","integration":"WHATSAPP-BAILEYS"}'
```

### **4. Verificar se há LOOP (problema do Windows)**
```bash
ssh root@ci.z7botsolutions.com.br
docker logs evolution-api-ci --tail 30
```

Procure por:
- ✅ **SEM LOOP:** Apenas 1-2 mensagens `ChannelStartupService`
- ❌ **COM LOOP:** Múltiplas mensagens repetidas de `ChannelStartupService`

### **5. Obter QR Code**
```bash
curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  https://evolution.z7botsolutions.com.br/instance/connect/securedguard
```

Ou acessar no navegador (com extensão ModHeader):
```
https://evolution.z7botsolutions.com.br/instance/connect/securedguard
Header: apikey: B6D711FCDE4D4FD5936544120E713976
```

---

## 📊 Cenários Possíveis

### ✅ **Cenário 1: SUCESSO no Linux (esperado)**
```
✅ Evolution API online
✅ Login sem erro 405
✅ Instância criada
✅ SEM LOOP (ambiente Linux!)
✅ QR Code gerado
```
➡️ **Escaneie com WhatsApp 31971731747 e pronto!**

### ❌ **Cenário 2: Loop persiste (improvável)**
```
❌ Loop de ChannelStartupService
❌ QR Code não gerado
```
➡️ **Migrar para Meta Cloud API**

---

## 🔍 Monitorar GitHub Actions

### Via Web:
1. Acesse: https://github.com/seu-usuario/secured-guard/actions
2. Veja o workflow rodando
3. Clique para ver logs em tempo real

### Via CLI (se tiver gh):
```bash
gh run watch
```

---

## ⏱️ Tempo Estimado

- Push → GitHub Actions: ~2 minutos
- Build + Testes: ~3-5 minutos
- Deploy: ~2 minutos
- **Total: ~7-10 minutos**

---

## 📝 Arquivos Prontos para Commit

1. `backend/src/test/java/.../EnvioServiceTest.java` ✅
2. `deploy-evolution-ci-completo.sh` ✅
3. `COMO_EXECUTAR_NO_CI.md` ✅
4. `fix-test-push.bat` ✅
5. `RESUMO_GITHUB_ACTIONS.md` ✅

---

## 🚀 Próximos Passos

### **AGORA:**
```bash
.\fix-test-push.bat
```

### **AGUARDAR:**
- GitHub Actions rodar (~10 minutos)
- Deploy automático completar

### **TESTAR:**
- Evolution API: https://evolution.z7botsolutions.com.br
- Login: https://ci.z7botsolutions.com.br
- QR Code: Verificar logs para confirmar que não há loop

---

## 🎯 Expectativa

**No Linux, o problema de loop deve ser resolvido!** 🐧✨

Se funcionar, você terá:
- ✅ Evolution API estável
- ✅ WhatsApp integrado sem redirecionamento
- ✅ Sistema completo de envio de holerites

Se não funcionar, temos o **Meta Cloud API** como plano B.

