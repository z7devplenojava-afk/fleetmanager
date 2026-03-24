# 🚨 Solução: Erro 405 no WhatsApp (Baileys Bloqueado)

## 📋 Problema

O Baileys está retornando erro **405 (Method Not Allowed)** ao tentar conectar com o WhatsApp.

```
Error: Connection Failure
data: { reason: '405', location: 'xxx' }
```

## 🔍 Causa

O WhatsApp frequentemente atualiza seu protocolo e bloqueia versões antigas do Baileys. Isso é uma **proteção anti-bot** do WhatsApp.

## ✅ Soluções Disponíveis

### **Opção 1: Evolution API (RECOMENDADO)**

A Evolution API é mais estável e mantida ativamente.

**Vantagens:**
- ✅ Mais estável que Baileys puro
- ✅ Atualizada frequentemente
- ✅ Suporte a múltiplas instâncias
- ✅ API REST completa
- ✅ Webhooks

**Como usar:**

```bash
# 1. Parar o Baileys atual
docker stop whatsapp-service

# 2. Subir Evolution API
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976 \
  atendai/evolution-api:latest

# 3. Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "securedguard",
    "integration": "WHATSAPP-BAILEYS"
  }'

# 4. Obter QR Code
curl http://localhost:8080/instance/connect/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

**Atualizar BaileysRestService:**

```java
@Value("${baileys.rest.url:http://localhost:8080}")
private String baileysRestUrl;

// Endpoints Evolution API:
// POST /message/sendText/{instance}
// POST /message/sendMedia/{instance}
```

---

### **Opção 2: WPPConnect**

Alternativa ao Baileys com melhor estabilidade.

```bash
# Subir WPPConnect
docker run -d \
  --name wppconnect \
  -p 21465:21465 \
  -e SECRET_KEY=THISISMYSECURETOKEN \
  wppconnect/wppconnect-server

# Acessar interface web
http://localhost:21465
```

---

### **Opção 3: Aguardar e Tentar Novamente**

Às vezes o bloqueio é temporário.

**Passos:**

1. **Aguardar 24-48 horas**
2. **Trocar de rede** (usar outro IP)
3. **Usar VPN** para mudar localização
4. **Atualizar Baileys** para versão mais recente

```bash
# Atualizar Baileys
cd whatsapp-service
npm update @whiskeysockets/baileys
docker-compose up -d --build whatsapp-service
```

---

### **Opção 4: WhatsApp Business API Oficial**

Para uso em produção, considere a API oficial.

**Vantagens:**
- ✅ Oficial e suportada pelo WhatsApp
- ✅ Sem risco de bloqueio
- ✅ Recursos avançados
- ✅ SLA garantido

**Desvantagens:**
- ❌ Pago (custo por mensagem)
- ❌ Processo de aprovação
- ❌ Requer Facebook Business

**Mais informações:**
https://business.whatsapp.com/products/business-platform

---

## 🔧 Solução Temporária: Usar Links do WhatsApp

Enquanto o Baileys não funciona, você pode usar **links do WhatsApp Web**.

**Como funciona:**

1. Sistema gera link do WhatsApp
2. Usuário clica no link
3. Abre WhatsApp Web com mensagem pré-preenchida
4. Usuário envia manualmente

**Já implementado no sistema:**

```java
// WhatsAppService.java
public String generateWhatsAppLink(String phoneNumber, String employeeName, String month, String year) {
    String message = String.format("""
        🏢 *SecuredGuard*
        
        Olá! Seu documento unificado foi gerado com sucesso!
        
        👤 *Funcionário:* %s
        📅 *Período:* %s/%s
        """, employeeName, month, year);
    
    return String.format("https://api.whatsapp.com/send?phone=%s&text=%s", 
        phoneNumber, URLEncoder.encode(message));
}
```

**Vantagens:**
- ✅ Funciona sempre
- ✅ Sem risco de bloqueio
- ✅ Não precisa de servidor
- ✅ Simples de implementar

**Desvantagens:**
- ❌ Não envia arquivo automaticamente
- ❌ Usuário precisa clicar
- ❌ Não é totalmente automático

---

## 📊 Comparação das Soluções

| Solução | Estabilidade | Custo | Automação | Dificuldade |
|---------|--------------|-------|-----------|-------------|
| **Evolution API** | ⭐⭐⭐⭐⭐ | Grátis | Total | Média |
| **WPPConnect** | ⭐⭐⭐⭐ | Grátis | Total | Média |
| **Baileys** | ⭐⭐ | Grátis | Total | Alta |
| **WhatsApp Business API** | ⭐⭐⭐⭐⭐ | Pago | Total | Alta |
| **Links WhatsApp** | ⭐⭐⭐⭐⭐ | Grátis | Parcial | Baixa |

---

## 🎯 Recomendação

### **Para Desenvolvimento/Testes:**
Use **Links do WhatsApp** (já implementado)

### **Para Produção:**
Use **Evolution API** ou **WhatsApp Business API**

---

## 🚀 Implementação Rápida: Evolution API

### **1. Docker Compose**

Adicione ao `docker-compose.yml`:

```yaml
services:
  evolution-api:
    image: atendai/evolution-api:latest
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976
      - DATABASE_ENABLED=true
      - DATABASE_CONNECTION_URI=mongodb://mongo:27017/evolution
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      - mongo

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  evolution_instances:
  mongo_data:
```

### **2. Atualizar application.properties**

```properties
# Evolution API
baileys.rest.url=http://localhost:8080
baileys.rest.token=B6D711FCDE4D4FD5936544120E713976
baileys.rest.instance.key=securedguard
```

### **3. Atualizar BaileysRestService**

```java
// Endpoints Evolution API
private static final String SEND_TEXT_ENDPOINT = "/message/sendText/{instance}";
private static final String SEND_MEDIA_ENDPOINT = "/message/sendMedia/{instance}";
private static final String INSTANCE_CONNECT = "/instance/connect/{instance}";
private static final String INSTANCE_STATE = "/instance/connectionState/{instance}";
```

### **4. Testar**

```bash
# Subir serviços
docker-compose up -d evolution-api mongo

# Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"securedguard","integration":"WHATSAPP-BAILEYS"}'

# Obter QR Code
curl http://localhost:8080/instance/connect/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"

# Enviar mensagem de teste
curl -X POST http://localhost:8080/message/sendText/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5531971731747",
    "text": "Teste de mensagem"
  }'
```

---

## 📞 Suporte

Se precisar de ajuda:

1. **Documentação Evolution API:** https://doc.evolution-api.com/
2. **GitHub Baileys:** https://github.com/WhiskeySockets/Baileys
3. **WPPConnect:** https://wppconnect.io/

---

**Data:** 2025-10-28  
**Status:** Erro 405 confirmado - WhatsApp bloqueando Baileys  
**Solução Recomendada:** Evolution API ou Links WhatsApp
