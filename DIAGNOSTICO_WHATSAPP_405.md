# 🔍 Diagnóstico Completo: Erro 405 WhatsApp Baileys

## 📊 Situação Atual

**Erro:** Connection Failure - 405 Method Not Allowed  
**Origem:** WhatsApp está rejeitando a conexão do Baileys  
**Impacto:** Não consegue gerar QR Code para conectar

## 🧪 Tentativas Realizadas

### ✅ Tentativa 1: Limpar Sessões
```bash
rm -rf sessions/securedguard/*
docker restart whatsapp-service
```
**Resultado:** ❌ Erro 405 persiste

### ✅ Tentativa 2: Atualizar Versão Fixa
```javascript
version = [2, 3000, 1017155907]
```
**Resultado:** ❌ Erro 405 persiste

### ✅ Tentativa 3: Usar Versão do GitHub
```json
"@whiskeysockets/baileys": "github:WhiskeySockets/Baileys"
```
**Resultado:** ❌ Erro 405 persiste (instalado mas ainda bloqueado)

### ✅ Tentativa 4: Mudar Browser User-Agent
```javascript
browser: ['Chrome (Linux)', '', '']
```
**Resultado:** ⏳ Testando...

## 🔍 Análise Técnica

### O que o erro 405 significa:

```javascript
{
  data: { reason: '405', location: 'xxx' },
  output: {
    statusCode: 405,
    error: 'Method Not Allowed',
    message: 'Connection Failure'
  }
}
```

**Interpretação:**
- O Baileys **consegue** conectar com os servidores do WhatsApp
- O WhatsApp **recebe** a requisição
- O WhatsApp **rejeita** com 405 (método não permitido)
- O `location` muda (rva, atn, vll, etc) = diferentes servidores WhatsApp

**Conclusão:** O WhatsApp está **ativamente bloqueando** esta versão/configuração do Baileys.

## 🚨 Por que isso acontece?

### 1. **Atualização do Protocolo**
O WhatsApp atualiza frequentemente seu protocolo para bloquear bots não oficiais.

### 2. **Detecção de Bot**
O WhatsApp detecta padrões de comportamento de bot:
- Múltiplas tentativas de conexão
- User-Agent suspeito
- Falta de interação humana
- Padrões de envio automatizado

### 3. **Bloqueio Regional/IP**
Pode haver bloqueio baseado em:
- IP do servidor
- Região geográfica
- ISP (provedor de internet)
- Histórico de uso

## ✅ Soluções Viáveis

### **Solução 1: Evolution API (RECOMENDADO)**

A Evolution API é um wrapper do Baileys que:
- ✅ Contorna bloqueios mais facilmente
- ✅ Atualiza automaticamente
- ✅ Tem suporte ativo da comunidade
- ✅ Funciona em produção

**Implementação:**

```bash
# 1. Parar Baileys atual
docker stop whatsapp-service
docker rm whatsapp-service

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
  -d '{"instanceName":"securedguard","integration":"WHATSAPP-BAILEYS"}'

# 4. Conectar (gera QR Code)
curl http://localhost:8080/instance/connect/securedguard \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"

# 5. Ver QR Code no navegador
start http://localhost:8080/instance/qrcode/securedguard?apikey=B6D711FCDE4D4FD5936544120E713976
```

**Adaptar BaileysRestService:**

```java
// Mudar endpoints para Evolution API
@Value("${baileys.rest.url:http://localhost:8080}")
private String evolutionApiUrl;

@Value("${baileys.rest.token:B6D711FCDE4D4FD5936544120E713976}")
private String apiKey;

public boolean sendFileMessage(String phoneNumber, String message, String filePath) {
    String url = evolutionApiUrl + "/message/sendMedia/" + instanceKey;
    
    HttpHeaders headers = new HttpHeaders();
    headers.set("apikey", apiKey);
    headers.setContentType(MediaType.APPLICATION_JSON);
    
    // Evolution API espera base64 ou URL do arquivo
    // Você pode enviar o arquivo via multipart ou base64
}
```

---

### **Solução 2: Usar Links WhatsApp (JÁ IMPLEMENTADO)**

Seu sistema já tem isso implementado no `WhatsAppService.java`:

```java
String link = whatsAppService.generateWhatsAppLink(
    phoneNumber, 
    employeeName, 
    month, 
    year
);
// Retorna: https://api.whatsapp.com/send?phone=5531971731747&text=...
```

**Vantagens:**
- ✅ Funciona sempre
- ✅ Sem bloqueios
- ✅ Sem servidor necessário

**Desvantagens:**
- ❌ Não envia arquivo automaticamente
- ❌ Usuário precisa clicar no link

---

### **Solução 3: Verificar se é Problema de Rede**

Vamos testar se o problema é firewall/proxy:

```powershell
# Testar conectividade com WhatsApp
Test-NetConnection -ComputerName web.whatsapp.com -Port 443

# Verificar se há proxy configurado
netsh winhttp show proxy

# Testar DNS
nslookup web.whatsapp.com
```

Se houver proxy corporativo, pode estar bloqueando WebSocket.

---

## 🎯 Recomendação Imediata

**Opção A: Evolution API (30 minutos de implementação)**
- Mais estável
- Contorna bloqueios
- Produção-ready

**Opção B: Usar Links WhatsApp (já funciona)**
- Solução temporária
- Funciona agora
- Sem mudanças necessárias

**Opção C: Investigar Rede**
- Testar em outra rede
- Usar VPN
- Verificar firewall

## 📝 Próximos Passos

**Você quer que eu:**

1. ✅ Implemente a Evolution API?
2. ✅ Configure para usar os links do WhatsApp?
3. ✅ Crie scripts de diagnóstico de rede?

**Qual caminho você prefere seguir?**
