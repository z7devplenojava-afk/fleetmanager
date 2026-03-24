# ========================================
# SCRIPT DE CONFIGURAÇÃO BAILEYS REST API
# ========================================
# Este script configura o Baileys REST API para integração com o SecureGuard
# Baseado no repositório: https://github.com/salman0ansari/whatsapp-api-nodejs.git

Write-Host "🚀 CONFIGURANDO BAILEYS REST API PARA SECUREDGUARD" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# ========================================
# 1. VERIFICAR PRÉ-REQUISITOS
# ========================================
Write-Host "`n📋 Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar Node.js
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "   Instale o Node.js em: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm não encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar Git
$gitVersion = git --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Git não encontrado!" -ForegroundColor Red
    Write-Host "   Instale o Git em: https://git-scm.com/" -ForegroundColor Yellow
    exit 1
}

# ========================================
# 2. CRIAR DIRETÓRIO DO BAILEYS REST
# ========================================
Write-Host "`n📁 Criando diretório do Baileys REST API..." -ForegroundColor Yellow

$baileysDir = "baileys-rest-api"
if (Test-Path $baileysDir) {
    Write-Host "⚠️ Diretório já existe. Removendo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $baileysDir
}

New-Item -ItemType Directory -Path $baileysDir | Out-Null
Set-Location $baileysDir

# ========================================
# 3. CLONAR REPOSITÓRIO
# ========================================
Write-Host "`n📥 Clonando repositório Baileys REST API..." -ForegroundColor Yellow

try {
    git clone https://github.com/salman0ansari/whatsapp-api-nodejs.git .
    Write-Host "✅ Repositório clonado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao clonar repositório: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# 4. INSTALAR DEPENDÊNCIAS
# ========================================
Write-Host "`n📦 Instalando dependências..." -ForegroundColor Yellow

try {
    npm install
    Write-Host "✅ Dependências instaladas com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar dependências: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# 5. CONFIGURAR ARQUIVO .ENV
# ========================================
Write-Host "`n⚙️ Configurando arquivo .env..." -ForegroundColor Yellow

# Gerar token aleatório
$token = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

$envContent = @"
# ========================================
# CONFIGURAÇÃO BAILEYS REST API
# ========================================
TOKEN=$token

# ========================================
# CONFIGURAÇÃO MONGODB (OPCIONAL)
# ========================================
MONGODB_ENABLED=false
MONGODB_URL=mongodb://localhost:27017/whatsapp_api

# ========================================
# CONFIGURAÇÃO DE PORTA
# ========================================
PORT=3333

# ========================================
# CONFIGURAÇÃO DE LOGS
# ========================================
LOG_LEVEL=info
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Arquivo .env configurado com token: $token" -ForegroundColor Green

# ========================================
# 6. CRIAR SCRIPT DE INICIALIZAÇÃO
# ========================================
Write-Host "`n📝 Criando script de inicialização..." -ForegroundColor Yellow

$startScript = @"
@echo off
echo ========================================
echo INICIANDO BAILEYS REST API
echo ========================================
echo.
echo Token: $token
echo URL: http://localhost:3333
echo QR Code: http://localhost:3333/instance/qr?key=securedguard
echo.
echo Pressione Ctrl+C para parar
echo ========================================
echo.

npm start
"@

$startScript | Out-File -FilePath "start_baileys.bat" -Encoding ASCII
Write-Host "✅ Script de inicialização criado" -ForegroundColor Green

# ========================================
# 7. CRIAR SCRIPT DE TESTE
# ========================================
Write-Host "`n🧪 Criando script de teste..." -ForegroundColor Yellow

$testScript = @"
# ========================================
# TESTE BAILEYS REST API
# ========================================

Write-Host "🧪 Testando Baileys REST API..." -ForegroundColor Yellow

# 1. Verificar se o servidor está rodando
Write-Host "`n1. Verificando status do servidor..." -ForegroundColor Cyan
try {
    `$response = Invoke-RestMethod -Uri "http://localhost:3333/instance/connectionState?key=securedguard" -Method GET
    Write-Host "✅ Servidor respondendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor não está rodando!" -ForegroundColor Red
    Write-Host "   Execute: .\start_baileys.bat" -ForegroundColor Yellow
    exit 1
}

# 2. Inicializar instância
Write-Host "`n2. Inicializando instância..." -ForegroundColor Cyan
try {
    `$response = Invoke-RestMethod -Uri "http://localhost:3333/instance/init?key=securedguard" -Method GET
    Write-Host "✅ Instância inicializada" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao inicializar instância (pode já estar inicializada)" -ForegroundColor Yellow
}

# 3. Obter QR Code
Write-Host "`n3. Obtendo QR Code..." -ForegroundColor Cyan
Write-Host "   Acesse: http://localhost:3333/instance/qr?key=securedguard" -ForegroundColor Yellow
Write-Host "   Escaneie o QR Code com seu WhatsApp" -ForegroundColor Yellow

# 4. Aguardar conexão
Write-Host "`n4. Aguardando conexão..." -ForegroundColor Cyan
`$maxAttempts = 30
`$attempt = 0

while (`$attempt -lt `$maxAttempts) {
    try {
        `$response = Invoke-RestMethod -Uri "http://localhost:3333/instance/connectionState?key=securedguard" -Method GET
        if (`$response -like "*open*") {
            Write-Host "✅ WhatsApp conectado!" -ForegroundColor Green
            break
        }
    } catch {
        # Ignorar erros durante verificação
    }
    
    Write-Host "   Aguardando... (`$attempt/`$maxAttempts)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    `$attempt++
}

if (`$attempt -ge `$maxAttempts) {
    Write-Host "❌ Timeout aguardando conexão" -ForegroundColor Red
    exit 1
}

# 5. Testar envio de mensagem
Write-Host "`n5. Testando envio de mensagem..." -ForegroundColor Cyan
`$testPhone = Read-Host "Digite um número de telefone para teste (com código do país)"
`$testMessage = "Teste do Baileys REST API - SecureGuard"

try {
    `$body = @{
        id = `$testPhone
        message = `$testMessage
    } | ConvertTo-Json

    `$response = Invoke-RestMethod -Uri "http://localhost:3333/message/text?key=securedguard" -Method POST -Body `$body -ContentType "application/json"
    Write-Host "✅ Mensagem de teste enviada!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao enviar mensagem de teste: `$(`$_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Teste concluído!" -ForegroundColor Green
"@

$testScript | Out-File -FilePath "test_baileys.ps1" -Encoding UTF8
Write-Host "✅ Script de teste criado" -ForegroundColor Green

# ========================================
# 8. CRIAR README
# ========================================
Write-Host "`n📖 Criando documentação..." -ForegroundColor Yellow

$readmeContent = @"
# BAILEYS REST API - SECUREDGUARD

## 📋 Configuração

Este diretório contém a instalação do Baileys REST API para integração com o SecureGuard.

## 🚀 Como usar

### 1. Iniciar o servidor
```bash
.\start_baileys.bat
```

### 2. Conectar WhatsApp
1. Acesse: http://localhost:3333/instance/qr?key=securedguard
2. Escaneie o QR Code com seu WhatsApp
3. Aguarde a conexão ser estabelecida

### 3. Testar integração
```bash
.\test_baileys.ps1
```

## 🔧 Configuração no SecureGuard

No arquivo `application-dev.properties`, habilite:

```properties
# Habilitar Baileys REST API
baileys.rest.enabled=true
baileys.rest.url=http://localhost:3333
baileys.rest.token=TOKEN_AQUI
baileys.rest.instance.key=securedguard
```

## 📱 Endpoints disponíveis

- `GET /instance/init?key=securedguard` - Inicializar instância
- `GET /instance/qr?key=securedguard` - Obter QR Code
- `GET /instance/connectionState?key=securedguard` - Verificar status
- `POST /message/text?key=securedguard` - Enviar mensagem
- `POST /message/document?key=securedguard` - Enviar arquivo

## 🔗 Integração com SecureGuard

O SecureGuard pode usar este servidor através dos endpoints:
- `POST /api/baileys/init` - Inicializar
- `GET /api/baileys/status` - Verificar status
- `GET /api/baileys/qr` - Obter QR Code
- `POST /api/baileys/send-test` - Enviar teste

## 🛠️ Solução de problemas

1. **Servidor não inicia**: Verifique se a porta 3333 está livre
2. **QR Code não aparece**: Reinicie o servidor
3. **Mensagens não enviam**: Verifique se o WhatsApp está conectado
4. **Erro de token**: Verifique o arquivo .env

## 📚 Documentação original

Repositório: https://github.com/salman0ansari/whatsapp-api-nodejs.git
"@

$readmeContent | Out-File -FilePath "README.md" -Encoding UTF8
Write-Host "✅ Documentação criada" -ForegroundColor Green

# ========================================
# 9. VOLTAR AO DIRETÓRIO ORIGINAL
# ========================================
Set-Location ..

# ========================================
# 10. RESUMO FINAL
# ========================================
Write-Host "`n🎉 CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "✅ Baileys REST API configurado em: $baileysDir" -ForegroundColor Green
Write-Host "✅ Token gerado: $token" -ForegroundColor Green
Write-Host "✅ Porta: 3333" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Entre no diretório: cd $baileysDir" -ForegroundColor Cyan
Write-Host "2. Inicie o servidor: .\start_baileys.bat" -ForegroundColor Cyan
Write-Host "3. Conecte o WhatsApp: http://localhost:3333/instance/qr?key=securedguard" -ForegroundColor Cyan
Write-Host "4. Teste a integração: .\test_baileys.ps1" -ForegroundColor Cyan
Write-Host "5. Habilite no SecureGuard: baileys.rest.enabled=true" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "🔗 URLs importantes:" -ForegroundColor Yellow
Write-Host "- Servidor: http://localhost:3333" -ForegroundColor Cyan
Write-Host "- QR Code: http://localhost:3333/instance/qr?key=securedguard" -ForegroundColor Cyan
Write-Host "- Status: http://localhost:3333/instance/connectionState?key=securedguard" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "📚 Documentação: $baileysDir\README.md" -ForegroundColor Cyan 