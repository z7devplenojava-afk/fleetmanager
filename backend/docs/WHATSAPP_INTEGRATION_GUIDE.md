# 📱 Guia de Integração WhatsApp - SecuredGuard

Este guia explica como configurar a integração WhatsApp usando **WPPConnect** e **Baileys** (ambos gratuitos) através do n8n.

## 🎯 Opções Disponíveis

### 1. **WPPConnect** (Recomendado)
- ✅ **Gratuito**
- ✅ **Estável**
- ✅ **Fácil configuração**
- ✅ **Suporte a arquivos**

### 2. **Baileys**
- ✅ **Gratuito**
- ✅ **Open Source**
- ✅ **Muito flexível**
- ⚠️ **Configuração mais complexa**

### 3. **Twilio** (Pago)
- ❌ **$0.0055 por mensagem**
- ✅ **Muito estável**
- ✅ **Suporte oficial**

---

## 🚀 Configuração WPPConnect

### Passo 1: Instalar WPPConnect
```bash
# Instalar Node.js (se não tiver)
# https://nodejs.org/

# Instalar WPPConnect
npm install -g @wppconnect-team/wppconnect

# Ou usar Docker
docker run -d --name wppconnect \
  -p 8080:8080 \
  -v /path/to/sessions:/sessions \
  wppconnect/wppconnect:latest
```

### Passo 2: Configurar WPPConnect
```javascript
// server.js
const { create, Whatsapp } = require('@wppconnect-team/wppconnect');

create({
    session: 'securedguard',
    catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
        console.log('QR Code:', asciiQR);
    },
    statusFind: (session, sessionData) => {
        console.log('WhatsApp conectado!');
    }
});
```

### Passo 3: Testar WPPConnect
```bash
# Verificar status
curl http://localhost:8080/api/status

# Enviar mensagem de teste
curl -X POST http://localhost:8080/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionName": "securedguard",
    "number": "5511999999999",
    "text": "Teste WPPConnect"
  }'
```

---

## 🔧 Configuração Baileys

### Passo 1: Criar Servidor Baileys
```bash
# Criar projeto
mkdir baileys-server
cd baileys-server
npm init -y

# Instalar dependências
npm install @whiskeysockets/baileys qrcode-terminal
```

### Passo 2: Criar servidor.js
```javascript
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

let sock = null;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp conectado!');
        }
    });
    
    sock.ev.on('creds.update', saveCreds);
}

// Endpoints
app.get('/status', (req, res) => {
    res.json({ connected: sock?.user !== undefined });
});

app.post('/send-message', async (req, res) => {
    const { to, text } = req.body;
    
    try {
        await sock.sendMessage(to, { text });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/send-file', async (req, res) => {
    const { to, filePath, caption, mimetype } = req.body;
    
    try {
        const fs = require('fs');
        const buffer = fs.readFileSync(filePath);
        
        await sock.sendMessage(to, {
            document: buffer,
            mimetype: mimetype || 'application/pdf',
            caption: caption
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Servidor Baileys rodando na porta 3000');
    connectToWhatsApp();
});
```

### Passo 3: Executar Baileys
```bash
node server.js
# Escanear QR Code no terminal
```

---

## 🔄 Configuração n8n

### Passo 1: Instalar n8n
```bash
# Instalar n8n
npm install -g n8n

# Executar n8n
n8n
```

### Passo 2: Importar Workflows
1. Acesse `http://localhost:5678`
2. Vá em **Workflows** → **Import from File**
3. Importe os arquivos:
   - `wppconnect-workflow.json`
   - `baileys-workflow.json`

### Passo 3: Configurar URLs
Nos workflows, atualize as URLs para:
- **WPPConnect**: `http://localhost:8080`
- **Baileys**: `http://localhost:3000`

---

## ⚙️ Configuração Backend

### 1. Atualizar application-dev.properties
```properties
# Provedor WhatsApp: wppconnect, baileys, twilio
n8n.whatsapp.provider=wppconnect

# URLs dos webhooks n8n
n8n.webhook.url=http://localhost:5678/webhook/whatsapp
n8n.wppconnect.url=http://localhost:5678/webhook/wppconnect
n8n.baileys.url=http://localhost:5678/webhook/baileys
```

### 2. Testar Integração
```bash
# Testar conexão
curl -X POST http://localhost:8080/api/envio/teste-whatsapp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "telefone": "5511999999999",
    "provedor": "wppconnect"
  }'
```

---

## 📱 Testando o Sistema

### 1. Teste de Conexão
```java
// No WhatsAppService
boolean conectado = whatsAppService.verificarConexao();
System.out.println("WhatsApp conectado: " + conectado);
```

### 2. Teste de Mensagem
```java
// Enviar mensagem simples
boolean enviado = whatsAppService.enviarMensagem("5511999999999", "Teste SecuredGuard");

// Enviar holerite
boolean holeriteEnviado = whatsAppService.enviarHolerite(
    "5511999999999", 
    "João Silva", 
    "/path/to/holerite.pdf"
);
```

### 3. Teste via Frontend
1. Acesse a página de Envio de Holerites
2. Clique em "Testar WhatsApp"
3. Verifique se a mensagem chega

---

## 🔧 Troubleshooting

### Problema: QR Code não aparece
**Solução:**
- Verifique se o WPPConnect/Baileys está rodando
- Limpe as sessões antigas: `rm -rf sessions/`

### Problema: Mensagem não envia
**Solução:**
- Verifique se o WhatsApp está conectado
- Confirme se o número está no formato correto: `5511999999999`
- Verifique os logs do n8n

### Problema: Arquivo não anexa
**Solução:**
- Verifique se o caminho do PDF está correto
- Confirme se o arquivo existe e tem permissões
- Teste com arquivo menor primeiro

---

## 📊 Monitoramento

### Logs Importantes
```bash
# WPPConnect
tail -f wppconnect.log

# Baileys
tail -f baileys.log

# n8n
tail -f ~/.n8n/logs/n8n.log

# Backend
tail -f application.log
```

### Métricas
- Mensagens enviadas por dia
- Taxa de sucesso
- Tempo de resposta
- Erros por provedor

---

## 🚀 Próximos Passos

1. **Configurar WPPConnect** (recomendado para começar)
2. **Testar com mensagens simples**
3. **Configurar envio de holerites**
4. **Implementar retry automático**
5. **Adicionar monitoramento**

---

## 📞 Suporte

- **WPPConnect**: https://github.com/wppconnect-team/wppconnect
- **Baileys**: https://github.com/whiskeysockets/baileys
- **n8n**: https://docs.n8n.io/

---

**🎉 Parabéns!** Seu sistema WhatsApp está configurado e funcionando! 