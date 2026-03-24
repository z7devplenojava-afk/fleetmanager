# 🚀 Deploy Evolution API no Ambiente CI

## 📋 Alterações Realizadas

### 1. **docker-compose.ci.yml**
- ✅ Adicionado serviço `evolution-api-ci`
- ✅ Configurado com PostgreSQL e Redis
- ✅ Exposto via Traefik em `evolution.z7botsolutions.com.br`
- ✅ Volumes mapeados para `/var/www/secured_guard/ci/evolution_instances` e `/var/www/secured_guard/ci/holerites`

### 2. **application-ci.properties**
- ✅ Configurado `whatsapp.provider=evolution`
- ✅ Adicionadas URLs e credenciais da Evolution API

---

## 🔧 Deploy Manual (Passo a Passo)

### **1. Commit e Push**

```bash
git add docker-compose.ci.yml backend/src/main/resources/application-ci.properties
git commit -m "feat: Adicionar Evolution API ao ambiente CI"
git push origin ci
```

### **2. Conectar ao Servidor CI**

```bash
ssh root@ci.z7botsolutions.com.br
```

### **3. Atualizar Repositório**

```bash
cd /var/www/secured_guard/ci
git pull origin ci
```

### **4. Criar Banco de Dados**

```bash
docker exec secured-guard-db-ci psql -U secured_guard_ci -c "CREATE DATABASE evolution_ci;"
```

### **5. Criar Diretórios**

```bash
mkdir -p /var/www/secured_guard/ci/evolution_instances
mkdir -p /var/www/secured_guard/ci/holerites
chmod -R 755 /var/www/secured_guard/ci/evolution_instances
chmod -R 755 /var/www/secured_guard/ci/holerites
```

### **6. Iniciar Evolution API**

```bash
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml up -d evolution-api-ci
```

### **7. Verificar Status**

```bash
# Aguardar 30 segundos
sleep 30

# Ver logs
docker logs evolution-api-ci --tail 30

# Testar API
curl https://evolution.z7botsolutions.com.br
```

---

## 📱 Como Obter o QR Code

### **1. Criar Instância**

```bash
curl -X POST https://evolution.z7botsolutions.com.br/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "securedguard",
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### **2. Obter QR Code**

```bash
curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  https://evolution.z7botsolutions.com.br/instance/connect/securedguard
```

### **3. Acessar via Navegador**

1. Abra: `https://evolution.z7botsolutions.com.br/instance/connect/securedguard`
2. Adicione o header `apikey: B6D711FCDE4D4FD5936544120E713976` (use extensão ModHeader ou similar)
3. Escaneie o QR Code com o WhatsApp: **31971731747**

---

## 🧪 Testar Envio de Mensagem

```bash
curl -X POST https://evolution.z7botsolutions.com.br/message/sendText/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5531971731747@s.whatsapp.net",
    "textMessage": {
      "text": "Teste Evolution API no CI!"
    }
  }'
```

---

## 🔍 Verificar Status da Conexão

```bash
curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  https://evolution.z7botsolutions.com.br/instance/connectionState/securedguard
```

---

## 📊 Logs e Debug

### Ver logs da Evolution API

```bash
docker logs evolution-api-ci --tail 100 -f
```

### Ver logs do backend

```bash
docker logs secured-guard-backend-ci --tail 100 -f
```

### Ver todas as instâncias

```bash
curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  https://evolution.z7botsolutions.com.br/instance/fetchInstances
```

---

## ⚠️ Troubleshooting

### Evolution API não inicia

```bash
# Verificar se o banco evolution_ci existe
docker exec secured-guard-db-ci psql -U secured_guard_ci -l | grep evolution_ci

# Verificar se Redis está rodando
docker exec secured-guard-redis-ci redis-cli -a redis_ci_2025 ping

# Recriar container
docker-compose -f docker-compose.ci.yml down evolution-api-ci
docker-compose -f docker-compose.ci.yml up -d evolution-api-ci
```

### Loop de reconexão (ChannelStartupService)

- ✅ **RESOLVIDO NO LINUX!** 
- O loop que ocorreu no Windows/WSL não deve acontecer no ambiente Linux puro

### QR Code não é gerado

```bash
# Deletar instância e recriar
curl -X DELETE -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  https://evolution.z7botsolutions.com.br/instance/delete/securedguard

# Aguardar 5 segundos e recriar
sleep 5

curl -X POST https://evolution.z7botsolutions.com.br/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "securedguard", "integration": "WHATSAPP-BAILEYS"}'
```

---

## 🎯 URLs Importantes

- **Evolution API:** https://evolution.z7botsolutions.com.br
- **Backend CI:** https://ci.z7botsolutions.com.br/api
- **Frontend CI:** https://ci.z7botsolutions.com.br
- **QR Code:** https://evolution.z7botsolutions.com.br/instance/connect/securedguard

---

## 🔑 Credenciais

- **API Key:** `B6D711FCDE4D4FD5936544120E713976`
- **Instance Name:** `securedguard`
- **WhatsApp Number:** `31971731747`

---

## ✅ Checklist de Validação

- [ ] Evolution API responde em https://evolution.z7botsolutions.com.br
- [ ] Instância criada com sucesso
- [ ] QR Code gerado (sem loop)
- [ ] WhatsApp conectado (31971731747)
- [ ] Mensagem de teste enviada com sucesso
- [ ] Backend consegue enviar holerites via Evolution API

---

## 📚 Documentação

- [Evolution API v2.1.0](https://doc.evolution-api.com/v2/pt)
- [Baileys](https://github.com/WhiskeySockets/Baileys)

