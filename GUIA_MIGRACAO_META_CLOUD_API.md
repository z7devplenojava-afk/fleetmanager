# 🚀 Guia de Migração: Meta Cloud API (WhatsApp Business)

## ❌ Problema: Baileys com erro 405

```
Baileys v6.7.8 → ERRO 405 ❌
Baileys v7.0.0-rc.6 → ERRO 405 ❌
WhatsApp bloqueando protocolo WebSocket
```

## ✅ Solução: Meta Cloud API (Oficial)

### 🎁 **Vantagens:**

| Característica | Baileys | Meta Cloud API |
|----------------|---------|----------------|
| **Oficial** | ❌ Não oficial | ✅ **API Oficial** |
| **Estabilidade** | ⚠️ Pode ser bloqueado | ✅ **100% confiável** |
| **Suporte** | 🤷 Comunidade | ✅ **Suporte Meta** |
| **Custo** | Grátis | **1000 msg/mês grátis** |
| **QR Code** | Sempre necessário | ❌ Não usa QR Code |
| **Webhooks** | Requer servidor | ✅ **Nativos** |
| **Templates** | ❌ Não tem | ✅ **Mensagens aprovadas** |
| **Produção** | ⚠️ Arriscado | ✅ **Pronto para produção** |

---

## 📋 Passo 1: Criar Conta no Meta for Developers (5 min)

### 1.1 Acessar:
```
https://developers.facebook.com/
```

### 1.2 Fazer Login:
- Use sua conta Facebook/Instagram
- Ou crie uma nova conta

### 1.3 Criar App:
1. Clique em **"Meus Apps"** → **"Criar App"**
2. Tipo: **"Negócios"** (Business)
3. Nome: `SecuredGuard WhatsApp`
4. Email de contato: seu email
5. Clique em **"Criar App"**

---

## 📋 Passo 2: Adicionar WhatsApp (2 min)

### 2.1 No Dashboard do App:
1. Procure **"WhatsApp"** na lista de produtos
2. Clique em **"Configurar"**
3. Escolha **"WhatsApp Business Platform"**

### 2.2 Obter credenciais:
```
📱 Phone Number ID: 123456789012345
🏢 WhatsApp Business Account ID: 987654321098765
🔑 Access Token (temporário): EAAxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:** Anote essas credenciais!

---

## 📋 Passo 3: Configurar Número de Teste (Grátis!)

### 3.1 Número de Teste:
A Meta fornece um **número de teste grátis** para desenvolvimento:
- Pode enviar para **até 5 números cadastrados**
- Válido por **90 dias**
- **Sem custo**

### 3.2 Adicionar destinatários de teste:
1. No painel do WhatsApp, vá em **"Números de telefone"**
2. Clique em **"Adicionar número de telefone"**
3. Digite o número no formato: `+5531971731747`
4. Confirme via SMS

---

## 📋 Passo 4: Obter Token Permanente (Opcional)

### 4.1 Para produção:
O token temporário expira em **24 horas**. Para produção:

1. Acesse **"Ferramentas"** → **"Explorador de API"**
2. Selecione seu app
3. Clique em **"Gerar Token de Acesso"**
4. Selecione permissões:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. Gere um **System User Token** (não expira)

---

## 🔧 Passo 5: Atualizar Backend (10 min)

### 5.1 Adicionar dependência (pom.xml):
```xml
<!-- Já existe no projeto -->
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
</dependency>
```

### 5.2 Configurar application.properties:
```properties
# Meta Cloud API
meta.whatsapp.api.url=https://graph.facebook.com/v21.0
meta.whatsapp.phone.number.id=SEU_PHONE_NUMBER_ID
meta.whatsapp.access.token=SEU_ACCESS_TOKEN
```

### 5.3 Criar MetaCloudApiService.java:

```java
package com.z7design.secured_guard.service;

import okhttp3.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.io.File;
import java.io.IOException;

@Slf4j
@Service
public class MetaCloudApiService {

    @Value("${meta.whatsapp.api.url}")
    private String apiUrl;

    @Value("${meta.whatsapp.phone.number.id}")
    private String phoneNumberId;

    @Value("${meta.whatsapp.access.token}")
    private String accessToken;

    private final OkHttpClient client = new OkHttpClient();

    /**
     * Envia mensagem de texto via Meta Cloud API
     */
    public boolean sendTextMessage(String phoneNumber, String message) {
        try {
            String url = String.format("%s/%s/messages", apiUrl, phoneNumberId);
            
            JSONObject payload = new JSONObject();
            payload.put("messaging_product", "whatsapp");
            payload.put("to", normalizePhoneNumber(phoneNumber));
            payload.put("type", "text");
            payload.put("text", new JSONObject().put("body", message));

            RequestBody body = RequestBody.create(
                payload.toString(),
                MediaType.parse("application/json")
            );

            Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + accessToken)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

            try (Response response = client.newCall(request).execute()) {
                String responseBody = response.body().string();
                log.info("✅ Meta API Response: {}", responseBody);
                return response.isSuccessful();
            }
        } catch (Exception e) {
            log.error("❌ Erro ao enviar mensagem: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Envia documento/PDF via Meta Cloud API
     */
    public boolean sendDocumentMessage(String phoneNumber, String filePath, String caption) {
        try {
            // Passo 1: Upload do arquivo
            String mediaId = uploadMedia(filePath);
            if (mediaId == null) {
                return false;
            }

            // Passo 2: Enviar mensagem com documento
            String url = String.format("%s/%s/messages", apiUrl, phoneNumberId);
            
            JSONObject payload = new JSONObject();
            payload.put("messaging_product", "whatsapp");
            payload.put("to", normalizePhoneNumber(phoneNumber));
            payload.put("type", "document");
            
            JSONObject document = new JSONObject();
            document.put("id", mediaId);
            if (caption != null && !caption.isEmpty()) {
                document.put("caption", caption);
            }
            document.put("filename", new File(filePath).getName());
            
            payload.put("document", document);

            RequestBody body = RequestBody.create(
                payload.toString(),
                MediaType.parse("application/json")
            );

            Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + accessToken)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

            try (Response response = client.newCall(request).execute()) {
                String responseBody = response.body().string();
                log.info("✅ Meta API Response: {}", responseBody);
                return response.isSuccessful();
            }
        } catch (Exception e) {
            log.error("❌ Erro ao enviar documento: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Faz upload de arquivo e retorna o Media ID
     */
    private String uploadMedia(String filePath) {
        try {
            File file = new File(filePath);
            if (!file.exists()) {
                log.error("❌ Arquivo não encontrado: {}", filePath);
                return null;
            }

            String url = String.format("%s/%s/media", apiUrl, phoneNumberId);

            RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("messaging_product", "whatsapp")
                .addFormDataPart("file", file.getName(),
                    RequestBody.create(file, MediaType.parse("application/pdf")))
                .build();

            Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + accessToken)
                .post(requestBody)
                .build();

            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    String responseBody = response.body().string();
                    JSONObject json = new JSONObject(responseBody);
                    String mediaId = json.getString("id");
                    log.info("✅ Arquivo enviado. Media ID: {}", mediaId);
                    return mediaId;
                } else {
                    log.error("❌ Erro no upload: {}", response.body().string());
                    return null;
                }
            }
        } catch (Exception e) {
            log.error("❌ Erro ao fazer upload: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Normaliza número de telefone (adiciona DDI 55 se necessário)
     */
    private String normalizePhoneNumber(String phoneNumber) {
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");
        
        if (!cleaned.startsWith("55") && cleaned.length() == 11) {
            cleaned = "55" + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Verifica status de saúde da API
     */
    public boolean checkHealth() {
        try {
            String url = String.format("%s/%s", apiUrl, phoneNumberId);
            
            Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + accessToken)
                .get()
                .build();

            try (Response response = client.newCall(request).execute()) {
                return response.isSuccessful();
            }
        } catch (Exception e) {
            log.error("❌ Erro no health check: {}", e.getMessage());
            return false;
        }
    }
}
```

### 5.4 Atualizar EnvioService.java:

```java
// Adicionar ao topo da classe
@Autowired(required = false)
private MetaCloudApiService metaCloudApiService;

// No método sendWhatsAppMessage, substituir:
private void sendWhatsAppMessage(String whatsappNumber, String filePath, String message) {
    try {
        // Usar Meta Cloud API se disponível
        if (metaCloudApiService != null) {
            log.info("📤 Enviando via Meta Cloud API para {}", whatsappNumber);
            boolean success = metaCloudApiService.sendDocumentMessage(
                whatsappNumber, 
                filePath, 
                message
            );
            
            if (!success) {
                throw new RuntimeException("Falha ao enviar via Meta Cloud API");
            }
        } 
        // Fallback para Baileys (se configurado)
        else if (baileysRestService != null) {
            log.info("📤 Enviando via Baileys para {}", whatsappNumber);
            baileysRestService.sendFileMessage(whatsappNumber, message, filePath);
        } 
        else {
            throw new RuntimeException("Nenhum serviço de WhatsApp configurado");
        }
    } catch (Exception e) {
        log.error("❌ Erro ao enviar WhatsApp: {}", e.getMessage(), e);
        throw e;
    }
}
```

---

## 🧪 Passo 6: Testar com Postman

### 6.1 Teste Simples (Text):
```bash
POST https://graph.facebook.com/v21.0/SEU_PHONE_NUMBER_ID/messages
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "5531971731747",
  "type": "text",
  "text": {
    "body": "Olá! Teste da Meta Cloud API"
  }
}
```

### 6.2 Teste com Documento:
```bash
# 1. Upload do arquivo
POST https://graph.facebook.com/v21.0/SEU_PHONE_NUMBER_ID/media
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: multipart/form-data

messaging_product: whatsapp
file: [selecionar arquivo PDF]

# Resposta: {"id":"MEDIA_ID_AQUI"}

# 2. Enviar mensagem com documento
POST https://graph.facebook.com/v21.0/SEU_PHONE_NUMBER_ID/messages
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "5531971731747",
  "type": "document",
  "document": {
    "id": "MEDIA_ID_AQUI",
    "caption": "Segue seu holerite",
    "filename": "holerite.pdf"
  }
}
```

---

## 📊 Comparativo de Custos

### **Plano Gratuito:**
- ✅ **1000 conversas/mês grátis**
- ✅ Conversas iniciadas pelo usuário: **GRÁTIS ilimitado**
- ✅ Número de teste: **GRÁTIS por 90 dias**

### **Plano Pago (após limite):**
- 💰 R$ 0,20 por conversa iniciada pelo negócio
- 💰 Conversas iniciadas pelo usuário: **SEMPRE GRÁTIS**
- 💰 Número próprio: R$ 100/mês (opcional)

**💡 Dica:** Para holerites, o usuário pode iniciar a conversa (enviar "Oi") e você responde com o PDF = **GRÁTIS!**

---

## ✅ Checklist de Migração

- [ ] Criar conta no Meta for Developers
- [ ] Criar app tipo "Business"
- [ ] Adicionar produto WhatsApp
- [ ] Obter Phone Number ID
- [ ] Obter Access Token
- [ ] Adicionar números de teste
- [ ] Testar envio com Postman
- [ ] Atualizar application.properties
- [ ] Criar MetaCloudApiService.java
- [ ] Atualizar EnvioService.java
- [ ] Recompilar backend
- [ ] Testar envio via sistema
- [ ] Monitorar logs
- [ ] (Opcional) Gerar token permanente
- [ ] (Opcional) Configurar número próprio

---

## 🆘 Suporte e Documentação

### **Documentação Oficial:**
```
https://developers.facebook.com/docs/whatsapp/cloud-api/
```

### **API Reference:**
```
https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
```

### **Suporte:**
```
https://developers.facebook.com/support/
```

---

## 🎯 Próximos Passos

**Quer que eu crie os arquivos Java agora?**

Digite:
- `"criar"` → Criar MetaCloudApiService.java
- `"testar"` → Criar script de teste Postman
- `"tudo"` → Criar tudo de uma vez

---

**Última Atualização:** 2025-10-29  
**Status:** ✅ Recomendado para Produção

