# 🚀 GUIA RÁPIDO - OPÇÃO C: TESTAR AMBAS AS APIS

## ✅ **STATUS: TUDO PRONTO!**

---

## 🎯 **O QUE FOI FEITO:**

### ✅ Backend configurado com AMBAS as APIs:
1. ✅ **Evolution API** (Baileys) - Gratuita
2. ✅ **Meta Cloud API** - Oficial

### ✅ Arquivos criados/atualizados:
- ✅ `EnvioService.java` - Suporta ambas as APIs
- ✅ `EvolutionApiService.java` - Service Evolution API
- ✅ `MetaWhatsAppService.java` - Service Meta Cloud API
- ✅ `EvolutionApiController.java` - Controller para gerenciar QR Code
- ✅ `application.properties` - Configuração para escolher qual API usar

### ✅ Docker:
- ✅ PostgreSQL rodando
- ✅ Evolution API rodando

---

## 📋 **AGORA VOCÊTEMOS 2 TAREFAS EM PARALELO:**

---

## 🔵 **TAREFA A: TESTAR EVOLUTION API (EU AJUDO - 15 MIN)**

### Passo 1: Conectar WhatsApp

Execute no navegador:
```
http://localhost:9000/manager
```

Ou use via API:
```bash
curl -X POST http://localhost:9000/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"securedguard","integration":"WHATSAPP-BAILEYS"}'
```

### Passo 2: Obter QR Code

```bash
curl http://localhost:9000/instance/connect/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

**Ou acesse diretamente:**
```
http://localhost:9000/instance/qrcode/securedguard?apikey=B6D711FCDE4D4FD5936544120E713976
```

### Passo 3: Escanear QR Code

1. Abra WhatsApp no celular
2. Menu → Aparelhos conectados
3. Conectar um aparelho
4. Escaneie o QR Code

### Passo 4: Testar envio

**Via Postman:**
```
POST http://localhost:8081/api/envio/individual
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer SEU_TOKEN"
}
Body: {
  "cpf": "00824310608",
  "tipo": "WHATSAPP",
  "mensagem": "Teste Evolution API"
}
```

**Verificar:**
- ✅ Mensagem chegou no destinatário correto?
- ✅ Sem redirecionamento?

---

## 🟢 **TAREFA B: CONFIGURAR META CLOUD API (VOCÊ FAZ - 30 MIN)**

### Passo 1: Obter credenciais

Siga o guia:
```
📄 GUIA_META_WHATSAPP_CLOUD_API.md
```

Link direto:
```
https://developers.facebook.com/
```

### Passo 2: Anotar credenciais

```
PHONE_NUMBER_ID: ___________________________
ACCESS_TOKEN: ________________________________
```

### Passo 3: Configurar backend

Edite:
```
backend/src/main/resources/application.properties
```

Substitua:
```properties
whatsapp.meta.phone-number-id=SEU_PHONE_NUMBER_ID_AQUI
whatsapp.meta.access-token=SEU_ACCESS_TOKEN_AQUI
```

### Passo 4: Escolher qual API usar

No mesmo arquivo, escolha:
```properties
# Para usar Evolution API (Baileys):
whatsapp.provider=evolution

# Para usar Meta Cloud API:
whatsapp.provider=meta
```

### Passo 5: Reiniciar backend

```powershell
cd C:\dev\secured-guard\backend
.\mvnw clean compile
.\mvnw spring-boot:run
```

---

## 🧪 **COMO TESTAR E COMPARAR:**

### Teste 1: Evolution API

1. Configure: `whatsapp.provider=evolution`
2. Reinicie backend
3. Certifique-se que WhatsApp está conectado
4. Envie teste via Postman
5. Verifique se chegou no número correto

### Teste 2: Meta Cloud API

1. Configure: `whatsapp.provider=meta`
2. Adicione credenciais (passo B)
3. Reinicie backend
4. Envie teste via Postman
5. Verifique se chegou no número correto

---

## 📊 **DECISÃO FINAL:**

### ✅ Se Evolution API funcionar:
```properties
whatsapp.provider=evolution
```
**Vantagens:**
- 💰 Gratuita
- ⚡ Rápida
- 🎯 Suficiente para suas necessidades

### ✅ Se Evolution API NÃO funcionar:
```properties
whatsapp.provider=meta
```
**Vantagens:**
- ✅ 100% confiável
- ✅ API oficial
- 💰 1.000 conversas grátis/mês

---

## 🎯 **PRÓXIMA AÇÃO:**

### AGORA MESMO:

1. **EU vou te ajudar** a conectar Evolution API via QR Code
2. **VOCÊ começa** a obter credenciais da Meta em paralelo

### Me avise quando:
- ✅ Conseguir escanear QR Code
- ✅ Obtiver credenciais da Meta
- ✅ Testar ambas as APIs

---

## 📞 **ENDPOINTS ÚTEIS:**

### Evolution API (http://localhost:9000):
```
GET  /instance/qrcode/securedguard?apikey=KEY
GET  /instance/connectionState/securedguard?apikey=KEY
POST /message/sendText/securedguard?apikey=KEY
POST /message/sendMedia/securedguard?apikey=KEY
```

### Seu Backend (http://localhost:8081):
```
GET  /api/evolution/instance/status
POST /api/evolution/instance/connect
POST /api/evolution/test/text?phoneNumber=X&message=Y
POST /api/envio/individual
POST /api/envio/massa
```

---

## ⚡ **ATALHOS:**

### Ver status Evolution API:
```powershell
curl http://localhost:9000/instance/connectionState/securedguard -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

### Ver QR Code no terminal:
```powershell
docker logs evolution-api --tail 50 | Select-String "QR"
```

### Reiniciar Evolution API:
```powershell
docker restart evolution-api
```

### Ver logs em tempo real:
```powershell
docker logs -f evolution-api
```

---

## 🚀 **VAMOS LÁ!**

**Qual API você quer testar primeiro?**
1. Evolution API (mais rápido de testar)
2. Meta Cloud API (mais confiável)
3. Ambas ao mesmo tempo

**Me responda e vamos começar!** 💪🚀

