# Setup WPPConnect - SecuredGuard
# Script para configurar rapidamente o WPPConnect

Write-Host "🚀 Configurando WPPConnect para SecuredGuard" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

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

# Criar diretório para WPPConnect
Write-Host "`n📁 Criando diretório para WPPConnect..." -ForegroundColor Yellow
$wppconnectDir = "wppconnect-server"
if (Test-Path $wppconnectDir) {
    Write-Host "⚠️ Diretório já existe: $wppconnectDir" -ForegroundColor Yellow
} else {
    New-Item -ItemType Directory -Path $wppconnectDir
    Write-Host "✅ Diretório criado: $wppconnectDir" -ForegroundColor Green
}

# Navegar para o diretório
Set-Location $wppconnectDir

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
npm install @wppconnect-team/wppconnect express cors

# Criar arquivo server.js
Write-Host "`n📝 Criando servidor WPPConnect..." -ForegroundColor Yellow
$serverCode = @'
const { create, Whatsapp } = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração WPPConnect
create({
    session: 'securedguard',
    catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
        console.log('QR Code:');
        console.log(asciiQR);
        console.log('URL Code:', urlCode);
    },
    statusFind: (session, sessionData) => {
        console.log('WhatsApp conectado!');
    },
    headless: false,
    devtools: false,
    useChrome: true,
    debug: false,
    logQR: true,
    browserWS: '',
    browserArgs: [],
    puppeteerOptions: {},
    disableWelcome: false,
    updatesLog: true,
    autoClose: 60000,
    tokenStore: 'file',
    folderNameToken: './tokens',
    mkdirFolderToken: '',
    headless: false,
    devtools: false,
    useChrome: true,
    debug: false,
    logQR: true,
    browserWS: '',
    browserArgs: [],
    puppeteerOptions: {},
    disableWelcome: false,
    updatesLog: true,
    autoClose: 60000,
    tokenStore: 'file',
    folderNameToken: './tokens',
    mkdirFolderToken: '',
    createOptions: {
        useChrome: true,
        headless: false,
        devtools: false,
        debug: false,
        logQR: true,
        browserWS: '',
        browserArgs: [],
        puppeteerOptions: {},
        disableWelcome: false,
        updatesLog: true,
        autoClose: 60000,
        tokenStore: 'file',
        folderNameToken: './tokens',
        mkdirFolderToken: ''
    }
});

// Endpoints da API
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'running',
        session: 'securedguard',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/send-message', async (req, res) => {
    try {
        const { sessionName, number, text } = req.body;
        
        const client = await Whatsapp.getInstance(sessionName);
        if (!client) {
            return res.status(404).json({ error: 'Sessão não encontrada' });
        }
        
        await client.sendText(number, text);
        res.json({ success: true, message: 'Mensagem enviada' });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/send-file', async (req, res) => {
    try {
        const { sessionName, number, path, caption } = req.body;
        
        const client = await Whatsapp.getInstance(sessionName);
        if (!client) {
            return res.status(404).json({ error: 'Sessão não encontrada' });
        }
        
        await client.sendFile(number, path, 'document', caption);
        res.json({ success: true, message: 'Arquivo enviado' });
    } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sessions', async (req, res) => {
    try {
        const sessions = await Whatsapp.getAllInstances();
        res.json({ sessions: sessions.map(s => s.session) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Servidor WPPConnect rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
});

console.log('🔧 Configurando WPPConnect...');
console.log('📱 Escaneie o QR Code que aparecerá em breve...');
'@

Set-Content -Path "server.js" -Value $serverCode
Write-Host "✅ Servidor WPPConnect criado" -ForegroundColor Green

# Criar arquivo package.json personalizado
Write-Host "`n📝 Atualizando package.json..." -ForegroundColor Yellow
$packageJson = @'
{
  "name": "wppconnect-securedguard",
  "version": "1.0.0",
  "description": "WPPConnect para SecuredGuard",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@wppconnect-team/wppconnect": "^1.25.0",
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
tokens/
sessions/
*.log
.env
'@

Set-Content -Path ".gitignore" -Value $gitignore
Write-Host "✅ .gitignore criado" -ForegroundColor Green

# Criar README
Write-Host "`n📝 Criando README..." -ForegroundColor Yellow
$readme = @'
# WPPConnect - SecuredGuard

Servidor WPPConnect para integração WhatsApp do sistema SecuredGuard.

## Instalação

```bash
npm install
```

## Execução

```bash
npm start
```

## Endpoints

- `GET /api/status` - Status do servidor
- `POST /api/send-message` - Enviar mensagem
- `POST /api/send-file` - Enviar arquivo
- `GET /api/sessions` - Listar sessões

## Configuração

1. Execute o servidor
2. Escaneie o QR Code no terminal
3. Configure o n8n para usar este servidor

## URLs

- Servidor: http://localhost:8080
- Webhook: http://localhost:8080/webhook
'@

Set-Content -Path "README.md" -Value $readme
Write-Host "✅ README criado" -ForegroundColor Green

# Voltar ao diretório original
Set-Location ..

Write-Host "`n🎉 Configuração WPPConnect concluída!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`n📋 Próximos Passos:" -ForegroundColor Cyan
Write-Host "1. Navegue para o diretório: cd $wppconnectDir" -ForegroundColor White
Write-Host "2. Execute o servidor: npm start" -ForegroundColor White
Write-Host "3. Escaneie o QR Code que aparecerá" -ForegroundColor White
Write-Host "4. Configure o n8n com a URL: http://localhost:8080" -ForegroundColor White
Write-Host "5. Teste a integração com: .\test_whatsapp_integration.ps1" -ForegroundColor White

Write-Host "`n🔗 URLs Importantes:" -ForegroundColor Cyan
Write-Host "- WPPConnect: http://localhost:8080" -ForegroundColor White
Write-Host "- n8n: http://localhost:5678" -ForegroundColor White
Write-Host "- Backend: http://localhost:8080" -ForegroundColor White

Write-Host "`n✅ Setup concluído com sucesso!" -ForegroundColor Green 