# 🚀 Migração Rápida para Evolution API

**Tempo estimado:** 15 minutos  
**Dificuldade:** Baixa

## 📋 Pré-requisitos

- ✅ Evolution API rodando no CI (já configurado)
- ✅ Backend Spring Boot
- ✅ Acesso ao servidor CI

## 🎯 Objetivo

Migrar do Baileys direto para Evolution API para resolver o erro 405.

## 📝 Passo a Passo

### 1. Verificar Evolution API no CI

```bash
# SSH no servidor CI
ssh usuario@ci.z7botsolutions.com.br

# Verificar se Evolution API está rodando
docker ps | grep evolution

# Testar endpoint
curl https://evolution.z7botsolutions.com.br/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "version": "2.1.0"
}
```

### 2. Criar Instância no Evolution API

```bash
curl -X POST https://evolution.z7botsolutions.com.br/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "securedguard",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Resposta esperada:**
```json
{
  "instance": {
    "instanceName": "securedguard",
    "status": "created"
  },
  "qrcode": {
    "code": "data:image/png;base64,..."
  }
}
```

### 3. Conectar WhatsApp (Escanear QR Code)

#### Opção A: Via Browser

1. Abra: `https://evolution.z7botsolutions.com.br/instance/qrcode/securedguard?apikey=B6D711FCDE4D4FD5936544120E713976`
2. Escaneie com WhatsApp
3. WhatsApp > Aparelhos conectados > Conectar aparelho

#### Opção B: Via API

```bash
# Obter QR Code em base64
curl https://evolution.z7botsolutions.com.br/instance/qrcode/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

### 4. Verificar Conexão

```bash
curl https://evolution.z7botsolutions.com.br/instance/connectionState/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

**Resposta esperada:**
```json
{
  "instance": "securedguard",
  "state": "open"
}
```

### 5. Atualizar Backend

#### 5.1. Atualizar application.properties

```properties
# backend/src/main/resources/application-test.properties

# Evolution API (CI)
baileys.rest.url=https://evolution.z7botsolutions.com.br
baileys.rest.instance.key=securedguard
baileys.rest.token=B6D711FCDE4D4FD5936544120E713976
```

#### 5.2. Atualizar BaileysRestService.java

Adicionar suporte para Evolution API:

```java
@Service
public class BaileysRestService {
    
    @Value("${baileys.rest.url:http://localhost:3333}")
    private String baileysRestUrl;
    
    @Value("${baileys.rest.token:}")
    private String baileysToken;
    
    @Value("${baileys.rest.instance.key:securedguard}")
    private String instanceKey;
    
    private final RestTemplate restTemplate;
    
    // Detectar se é Evolution API ou Baileys direto
    private boolean isEvolutionApi() {
        return !baileysToken.isEmpty();
    }
    
    // Criar headers com autenticação
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        if (isEvolutionApi()) {
            headers.set("apikey", baileysToken);
        }
        
        return headers;
    }
    
    // Enviar arquivo via Evolution API
    public boolean sendFileMessage(String phoneNumber, String message, String filePath) {
        try {
            File file = new File(filePath);
            if (!file.exists()) {
                logger.error("❌ Arquivo não existe: {}", filePath);
                return false;
            }
            
            String normalizedNumber = normalizePhoneNumber(phoneNumber);
            
            if (isEvolutionApi()) {
                // Evolution API endpoint
                String url = baileysRestUrl + "/message/sendMedia/" + instanceKey;
                
                HttpHeaders headers = createHeaders();
                
                ObjectNode body = objectMapper.createObjectNode();
                body.put("number", normalizedNumber);
                body.put("mediatype", "document");
                body.put("mimetype", "application/pdf");
                body.put("caption", message);
                body.put("fileName", file.getName());
                
                // Ler arquivo e converter para base64
                byte[] fileContent = Files.readAllBytes(file.toPath());
                String base64 = Base64.getEncoder().encodeToString(fileContent);
                body.put("media", base64);
                
                HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);
                ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
                
                return response.getStatusCode() == HttpStatus.OK;
                
            } else {
                // Baileys direto (código existente)
                String dockerFilePath = convertToDockerPath(filePath);
                String url = baileysRestUrl + "/message/document?key=" + instanceKey;
                
                // ... código existente ...
            }
            
        } catch (Exception e) {
            logger.error("❌ Erro ao enviar arquivo", e);
            return false;
        }
    }
}
```

### 6. Testar Envio

```bash
# Fazer login no backend
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha"}' | jq -r '.token')

# Testar envio individual
curl -X POST http://localhost:8080/api/envio/individual \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "whatsapp",
    "cpf": "12345678900",
    "mensagem": "Teste Evolution API"
  }'
```

## 🔄 Alternativa: Usar Evolution API sem modificar código

Se não quiser modificar o código, pode usar um proxy/adapter:

### Criar adapter Evolution API → Baileys

```javascript
// evolution-adapter.js
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const EVOLUTION_URL = 'https://evolution.z7botsolutions.com.br';
const EVOLUTION_KEY = 'B6D711FCDE4D4FD5936544120E713976';
const INSTANCE = 'securedguard';

// Adapter: Baileys format → Evolution format
app.post('/message/document', async (req, res) => {
  try {
    const { id, filepath, message } = req.body;
    
    // Ler arquivo
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filepath);
    const base64 = fileBuffer.toString('base64');
    const fileName = require('path').basename(filepath);
    
    // Enviar via Evolution API
    const response = await axios.post(
      `${EVOLUTION_URL}/message/sendMedia/${INSTANCE}`,
      {
        number: id,
        mediatype: 'document',
        mimetype: 'application/pdf',
        caption: message,
        fileName: fileName,
        media: base64
      },
      {
        headers: { apikey: EVOLUTION_KEY }
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3333, () => console.log('Adapter rodando na porta 3333'));
```

## ✅ Checklist de Migração

- [ ] Evolution API rodando no CI
- [ ] Instância criada
- [ ] QR Code escaneado
- [ ] Conexão verificada (state: open)
- [ ] Backend atualizado
- [ ] Teste de envio realizado
- [ ] Logs verificados

## 🐛 Troubleshooting

### Erro: "Instance not found"

**Solução:** Criar instância novamente

```bash
curl -X POST https://evolution.z7botsolutions.com.br/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "securedguard", "qrcode": true}'
```

### Erro: "Instance not connected"

**Solução:** Escanear QR Code novamente

```bash
# Obter novo QR Code
curl https://evolution.z7botsolutions.com.br/instance/qrcode/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

### Erro: "Unauthorized"

**Solução:** Verificar apikey

```bash
# Verificar se apikey está correta
echo "B6D711FCDE4D4FD5936544120E713976"
```

## 📊 Comparação

| Feature | Baileys Direto | Evolution API |
|---------|----------------|---------------|
| Conexão | ❌ Erro 405 | ✅ Estável |
| QR Code | ❌ Não disponível | ✅ Via web |
| Reconexão | ❌ Manual | ✅ Automática |
| Interface | ❌ Nenhuma | ✅ Web UI |
| Logs | ⚠️ Básicos | ✅ Detalhados |
| Webhooks | ❌ Não | ✅ Sim |

## 🎯 Resultado Esperado

Após a migração:

- ✅ WhatsApp conectado e estável
- ✅ Envio de holerites funcionando
- ✅ Logs detalhados de envio
- ✅ Reconexão automática
- ✅ Interface web para gerenciamento

## 📞 Suporte

### Documentação Evolution API

- Docs: https://doc.evolution-api.com
- GitHub: https://github.com/EvolutionAPI/evolution-api

### Comandos Úteis

```bash
# Listar instâncias
curl https://evolution.z7botsolutions.com.br/instance/fetchInstances \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"

# Desconectar instância
curl -X DELETE https://evolution.z7botsolutions.com.br/instance/logout/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"

# Reiniciar instância
curl -X PUT https://evolution.z7botsolutions.com.br/instance/restart/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

---

**Última atualização:** 28/10/2025 23:50  
**Status:** Pronto para migração  
**Tempo estimado:** 15 minutos
