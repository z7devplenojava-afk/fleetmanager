# ✅ Teste Rápido - WhatsApp Conectado

## 📱 Após Escanear o QR Code

Quando você escanear o QR Code, os logs devem mostrar:

```
Connection update: {"connection":"open","qr":null}
✅ WhatsApp connected and ready!
```

---

## 🧪 Testes Rápidos

### 1. Verificar Status da Conexão

```powershell
Invoke-RestMethod -Uri "http://localhost:3333/instance/connectionState"
```

**Esperado**:
```json
{
  "state": "open"
}
```

---

### 2. Verificar Health

```powershell
Invoke-RestMethod -Uri "http://localhost:3333/health"
```

**Esperado**:
```json
{
  "status": "ok",
  "ready": true
}
```

---

### 3. Enviar Mensagem de Teste

```powershell
$body = @{
    id = "SEU_NUMERO_AQUI"  # Ex: 5511999999999
    message = "✅ Teste do Baileys Standalone! WhatsApp conectado com sucesso!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3333/message/text" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**Esperado**:
```json
{
  "success": true
}
```

---

### 4. Enviar Documento/PDF

```powershell
$body = @{
    id = "SEU_NUMERO_AQUI"  # Ex: 5511999999999
    message = "Segue o documento em anexo"
    filepath = "/app/holerites/teste.pdf"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3333/message/document" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

---

## 🔧 Integração com Backend Spring Boot

### No seu `application.yml` ou `.env`:

```yaml
whatsapp:
  service:
    url: http://localhost:3333
    enabled: true
```

### No código Java:

```java
@Service
public class WhatsAppService {
    
    @Value("${whatsapp.service.url}")
    private String whatsappUrl;
    
    private final RestTemplate restTemplate;
    
    public void sendTextMessage(String phoneNumber, String message) {
        String url = whatsappUrl + "/message/text";
        
        Map<String, String> request = new HashMap<>();
        request.put("id", phoneNumber);
        request.put("message", message);
        
        restTemplate.postForObject(url, request, Map.class);
    }
    
    public void sendDocument(String phoneNumber, String message, String filepath) {
        String url = whatsappUrl + "/message/document";
        
        Map<String, String> request = new HashMap<>();
        request.put("id", phoneNumber);
        request.put("message", message);
        request.put("filepath", filepath);
        
        restTemplate.postForObject(url, request, Map.class);
    }
    
    public boolean isConnected() {
        String url = whatsappUrl + "/instance/connectionState";
        Map<String, String> response = restTemplate.getForObject(url, Map.class);
        return "open".equals(response.get("state"));
    }
}
```

---

## 📊 Monitorar Logs

```bash
# Logs em tempo real
docker logs -f whatsapp-service

# Últimas 50 linhas
docker logs whatsapp-service --tail 50

# Procurar por erros
docker logs whatsapp-service | grep -i error
```

---

## 🔄 Manutenção

### Reiniciar WhatsApp:
```bash
docker restart whatsapp-service
```

### Limpar sessão e reconectar:
```bash
docker exec whatsapp-service rm -rf /app/sessions/securedguard
docker restart whatsapp-service
# Aguarde 10 segundos e pegue novo QR Code
```

### Parar tudo:
```bash
docker-compose down
```

### Iniciar tudo:
```bash
docker-compose up -d
```

---

## 🎯 Próximos Passos

1. ✅ ~~QR Code gerado~~
2. ⏳ **Escanear QR Code** (faça agora!)
3. ⏳ Aguardar mensagem "WhatsApp connected and ready!"
4. ⏳ Testar envio de mensagem
5. ⏳ Integrar com backend
6. ⏳ Testar envio de holerites

---

## 🐛 Troubleshooting

### Erro 503 "Client not ready":
- WhatsApp ainda não conectou
- Escaneie o QR Code primeiro

### Erro 405 "Connection Failure":
- WhatsApp bloqueou temporariamente
- Aguarde 30 minutos ou use VPN
- Limpe a sessão e tente novamente

### Erro 404 "QR not available":
- QR Code expirou
- Aguarde ~30 segundos
- Um novo será gerado automaticamente

---

## 📱 **ESCANEIE O QR CODE AGORA!**

**Aguardando conexão...** ⏳

