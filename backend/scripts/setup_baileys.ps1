# Setup Baileys - SecuredGuard
# Script para configurar rapidamente o Baileys

Write-Host "🚀 Configurando Baileys para SecuredGuard" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Verificar se Node.js está instalado
Write-Host "`n🔍 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "📥 Baixe e instale o Node.js em: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar se npm está instalado
Write-Host "`n🔍 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado!" -ForegroundColor Red
    exit 1
}

# Criar diretório para Baileys
Write-Host "`n📁 Criando diretório para Baileys..." -ForegroundColor Yellow
$baileysDir = "baileys-server"
if (Test-Path $baileysDir) {
    Write-Host "⚠️ Diretório já existe: $baileysDir" -ForegroundColor Yellow
} else {
    New-Item -ItemType Directory -Path $baileysDir
    Write-Host "✅ Diretório criado: $baileysDir" -ForegroundColor Green
}

# Navegar para o diretório
Set-Location $baileysDir

# Inicializar projeto npm
Write-Host "`n📦 Inicializando projeto npm..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "⚠️ package.json já existe" -ForegroundColor Yellow
} else {
    npm init -y
    Write-Host "✅ Projeto npm inicializado" -ForegroundColor Green
}

# Instalar dependências
Write-Host "`n📥 Instalando dependências..." -ForegroundColor Yellow
npm install @whiskeysockets/baileys qrcode-terminal express cors

# Criar arquivo server.js
Write-Host "`n📝 Criando servidor Baileys..." -ForegroundColor Yellow
$serverCode = @'
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let sock = null;
let isConnected = false;

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            defaultQueryTimeoutMs: undefined,
        });
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 QR Code para conectar:');
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'close') {
                isConnected = false;
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❌ Conexão fechada:', lastDisconnect?.error, ', Reconectando:', shouldReconnect);
                if (shouldReconnect) {
                    connectToWhatsApp();
                }
            } else if (connection === 'open') {
                isConnected = true;
                console.log('✅ WhatsApp conectado!');
                console.log('👤 Usuário:', sock.user.name);
            }
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.key.fromMe && m.type === 'notify') {
                console.log('📨 Nova mensagem recebida:', msg.message?.conversation || 'Mídia');
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao conectar:', error);
        setTimeout(connectToWhatsApp, 5000);
    }
}

// Endpoints da API
app.get('/status', (req, res) => {
    res.json({ 
        connected: isConnected,
        user: sock?.user ? {
            id: sock.user.id,
            name: sock.user.name
        } : null,
        timestamp: new Date().toISOString()
    });
});

app.post('/send-message', async (req, res) => {
    try {
        const { to, text } = req.body;
        
        if (!sock || !isConnected) {
            return res.status(503).json({ error: 'WhatsApp não está conectado' });
        }
        
        const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
        
        await sock.sendMessage(jid, { text });
        res.json({ success: true, message: 'Mensagem enviada' });
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/send-file', async (req, res) => {
    try {
        const { to, filePath, caption, mimetype } = req.body;
        
        if (!sock || !isConnected) {
            return res.status(503).json({ error: 'WhatsApp não está conectado' });
        }
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
        
        const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
        const buffer = fs.readFileSync(filePath);
        
        await sock.sendMessage(jid, {
            document: buffer,
            mimetype: mimetype || 'application/pdf',
            caption: caption || '',
            fileName: path.basename(filePath)
        });
        
        res.json({ success: true, message: 'Arquivo enviado' });
    } catch (error) {
        console.error('❌ Erro ao enviar arquivo:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/sessions', (req, res) => {
    res.json({ 
        connected: isConnected,
        sessionId: 'securedguard-session'
    });
});

// Endpoint para verificar se está online
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        whatsapp: isConnected,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Baileys rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`🔗 Status: http://localhost:${PORT}/status`);
    console.log(`❤️ Health: http://localhost:${PORT}/health`);
});

console.log('🔧 Configurando Baileys...');
console.log('📱 Escaneie o QR Code que aparecerá em breve...');

// Conectar ao WhatsApp
connectToWhatsApp();
'@

Set-Content -Path "server.js" -Value $serverCode
Write-Host "✅ Servidor Baileys criado" -ForegroundColor Green

# Criar arquivo package.json personalizado
Write-Host "`n📝 Atualizando package.json..." -ForegroundColor Yellow
$packageJson = @'
{
  "name": "baileys-securedguard",
  "version": "1.0.0",
  "description": "Baileys para SecuredGuard",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.6.0",
    "qrcode-terminal": "^0.12.0",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
'@

Set-Content -Path "package.json" -Value $packageJson
Write-Host "✅ package.json atualizado" -ForegroundColor Green

# Criar arquivo .gitignore
Write-Host "`n📝 Criando .gitignore..." -ForegroundColor Yellow
$gitignore = @'
node_modules/
auth_info_baileys/
*.log
.env
'@

Set-Content -Path ".gitignore" -Value $gitignore
Write-Host "✅ .gitignore criado" -ForegroundColor Green

# Criar README
Write-Host "`n📝 Criando README..." -ForegroundColor Yellow
$readme = @'
# Baileys - SecuredGuard

Servidor Baileys para integração WhatsApp do sistema SecuredGuard.

## Instalação

```bash
npm install
```

## Execução

```bash
npm start
```

## Endpoints

- `GET /status` - Status do WhatsApp
- `POST /send-message` - Enviar mensagem
- `POST /send-file` - Enviar arquivo
- `GET /sessions` - Listar sessões
- `GET /health` - Health check

## Configuração

1. Execute o servidor
2. Escaneie o QR Code no terminal
3. Configure o n8n para usar este servidor

## URLs

- Servidor: http://localhost:3000
- Status: http://localhost:3000/status
- Health: http://localhost:3000/health

## Exemplo de Uso

```bash
# Enviar mensagem
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{"to": "5511999999999", "text": "Teste Baileys"}'

# Enviar arquivo
curl -X POST http://localhost:3000/send-file \
  -H "Content-Type: application/json" \
  -d '{"to": "5511999999999", "filePath": "/path/to/file.pdf", "caption": "Holerite"}'
```
'@

Set-Content -Path "README.md" -Value $readme
Write-Host "✅ README criado" -ForegroundColor Green

# Voltar ao diretório original
Set-Location ..

Write-Host "`n🎉 Configuração Baileys concluída!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Write-Host "`n📋 Próximos Passos:" -ForegroundColor Cyan
Write-Host "1. Navegue para o diretório: cd $baileysDir" -ForegroundColor White
Write-Host "2. Execute o servidor: npm start" -ForegroundColor White
Write-Host "3. Escaneie o QR Code que aparecerá" -ForegroundColor White
Write-Host "4. Configure o n8n com a URL: http://localhost:3000" -ForegroundColor White
Write-Host "5. Teste a integração com: .\test_whatsapp_integration.ps1 -Provider baileys" -ForegroundColor White

Write-Host "`n🔗 URLs Importantes:" -ForegroundColor Cyan
Write-Host "- Baileys: http://localhost:3000" -ForegroundColor White
Write-Host "- n8n: http://localhost:5678" -ForegroundColor White
Write-Host "- Backend: http://localhost:8080" -ForegroundColor White

Write-Host "`n⚠️ Notas Importantes:" -ForegroundColor Yellow
Write-Host "- Baileys é mais complexo que WPPConnect" -ForegroundColor White
Write-Host "- Pode demorar mais para conectar" -ForegroundColor White
Write-Host "- Mantenha o terminal aberto" -ForegroundColor White
Write-Host "- Use apenas um provedor por vez" -ForegroundColor White

Write-Host "`n✅ Setup concluído com sucesso!" -ForegroundColor Green 