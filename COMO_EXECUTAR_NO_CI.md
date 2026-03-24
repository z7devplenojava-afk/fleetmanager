# 🚀 Como Executar no Servidor CI

## 📋 Passo a Passo

### **1. Conectar ao Servidor CI**

```bash
ssh root@ci.z7botsolutions.com.br
```

### **2. Ir para o Diretório**

```bash
cd /var/www/secured_guard/ci
```

### **3. Fazer Pull**

```bash
git pull origin ci
```

### **4. Executar o Script de Deploy**

```bash
chmod +x deploy-evolution-ci-completo.sh
./deploy-evolution-ci-completo.sh
```

---

## 🎯 O que o Script Faz Automaticamente

✅ Faz git pull  
✅ Cria banco `evolution_ci`  
✅ Cria diretórios necessários  
✅ Recria containers (backend + evolution)  
✅ Aguarda 45s para inicialização  
✅ Testa Evolution API  
✅ Testa login (verifica correção 405)  
✅ Cria instância Evolution  
✅ **Verifica se há loop** (problema do Windows)  
✅ Obtém QR Code  

---

## 📊 Resultados Esperados

### ✅ **SE DER CERTO (Linux):**
```
✅ EVOLUTION API ONLINE!
✅ Login funcionando sem erro 405!
✅ Instância criada!
✅ SEM LOOP! FUNCIONANDO!
✅ QR CODE GERADO COM SUCESSO!

📱 ACESSE PARA ESCANEAR:
https://evolution.z7botsolutions.com.br/instance/connect/securedguard

API Key: B6D711FCDE4D4FD5936544120E713976
Número: 31971731747
```

### ❌ **SE DER ERRADO (mesmo problema do Windows):**
```
❌ LOOP DETECTADO!
Problema persiste mesmo no Linux!
```

Neste caso, vamos precisar usar **Meta Cloud API** definitivamente.

---

## 🔍 Verificação Manual (se necessário)

### Ver logs da Evolution:
```bash
docker logs evolution-api-ci --tail 50 -f
```

### Ver logs do backend:
```bash
docker logs secured-guard-backend-ci --tail 50 -f
```

### Testar Evolution API:
```bash
curl https://evolution.z7botsolutions.com.br
```

### Testar login:
```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}'
```

### Obter QR Code manualmente:
```bash
curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  https://evolution.z7botsolutions.com.br/instance/connect/securedguard
```

---

## 🎯 Após o Sucesso

1. **Abra no navegador:** `https://evolution.z7botsolutions.com.br/instance/connect/securedguard`
2. **Adicione header** (use extensão ModHeader): `apikey: B6D711FCDE4D4FD5936544120E713976`
3. **Escaneie com WhatsApp:** 31971731747
4. **Teste envio de mensagem** via backend

---

## ✅ Checklist

- [ ] Conectado ao servidor CI
- [ ] Script executado
- [ ] Evolution API online
- [ ] Login sem erro 405
- [ ] Instância criada
- [ ] **SEM LOOP** (confirmado no Linux!)
- [ ] QR Code gerado
- [ ] WhatsApp conectado
- [ ] Mensagem de teste enviada

---

## 🔄 Se Precisar Recriar Tudo

```bash
cd /var/www/secured_guard/ci

# Parar tudo
docker-compose -f docker-compose.ci.yml down evolution-api-ci

# Remover banco
docker exec secured-guard-db-ci psql -U secured_guard_ci -c "DROP DATABASE evolution_ci;"

# Executar script novamente
./deploy-evolution-ci-completo.sh
```

