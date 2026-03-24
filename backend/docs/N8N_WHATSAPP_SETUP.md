# Configuração N8N para WhatsApp - SecuredGuard

Este guia explica como configurar o n8n para integração com WhatsApp no sistema SecuredGuard.

## 📋 Pré-requisitos

- Docker Desktop instalado e rodando
- Node.js (opcional, para desenvolvimento)
- Acesso à internet para download das imagens

## 🚀 Instalação Rápida

### 1. Executar Script de Configuração

```powershell
# No diretório do projeto
cd backend
.\setup-n8n.ps1
```

### 2. Verificar Instalação

- Acesse: http://localhost:5678
- Login: `admin` / `securedguard2024`

## 🔧 Configuração Manual

### 1. Instalar n8n via Docker

```bash
# Criar diretório de dados
mkdir C:\n8n-data

# Executar n8n
docker run -it --rm \
  --name securedguard-n8n \
  -p 5678:5678 \
  -v C:\n8n-data:/home/node/.n8n \
  -v ./n8n-workflows:/home/node/.n8n/workflows \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=securedguard2024 \
  -e N8N_HOST=localhost \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=http \
  -e N8N_WEBHOOK_URL=http://localhost:5678/ \
  -e GENERIC_TIMEZONE=America/Sao_Paulo \
  n8nio/n8n:latest
```

### 2. Instalar WPPConnect (Recomendado)

```bash
docker run -it --rm \
  --name securedguard-wppconnect \
  -p 21465:21465 \
  -e WPPCONNECT_SERVER_PORT=21465 \
  -e WPPCONNECT_SERVER_HOST=0.0.0.0 \
  -e WPPCONNECT_SERVER_SECRET=securedguard-secret \
  -e WPPCONNECT_SERVER_TOKEN=securedguard-token \
  wppconnect/wppconnect:latest
```

## 📱 Configuração dos Provedores WhatsApp

### WPPConnect (Recomendado)

1. **Acessar WPPConnect:**
   - URL: http://localhost:21465
   - Documentação: https://wppconnect.io/

2. **Criar Sessão:**
   ```bash
   curl -X POST http://localhost:21465/api/sessions/add \
     -H "Content-Type: application/json" \
     -d '{"sessionName": "securedguard"}'
   ```

3. **Conectar WhatsApp:**
   - Acesse: http://localhost:21465
   - Escaneie o QR Code com seu WhatsApp

### Baileys

1. **Instalar Baileys:**
   ```bash
   docker run -it --rm \
     --name securedguard-baileys \
     -p 3000:3000 \
     baileys-whatsapp:latest
   ```

2. **Configurar credenciais no n8n**

### Twilio

1. **Criar conta Twilio:**
   - Acesse: https://www.twilio.com/
   - Obtenha Account SID e Auth Token

2. **Configurar no n8n:**
   - Account SID: `{{ $env.TWILIO_ACCOUNT_SID }}`
   - Auth Token: `{{ $env.TWILIO_AUTH_TOKEN }}`

## 🔄 Importar Workflow

### 1. Acessar n8n
- URL: http://localhost:5678
- Login: `admin` / `securedguard2024`

### 2. Importar Workflow
1. Clique em "Import from file"
2. Selecione: `n8n-workflows/whatsapp-envio-holerites.json`
3. Clique em "Import"

### 3. Configurar Credenciais

#### WPPConnect Credentials
- **Name:** WPPConnect Auth
- **Type:** HTTP Header Auth
- **Name:** Authorization
- **Value:** Bearer securedguard-token

#### Baileys Credentials
- **Name:** Baileys Auth
- **Type:** HTTP Header Auth
- **Name:** Authorization
- **Value:** Bearer your-baileys-token

#### Twilio Credentials
- **Name:** Twilio Auth
- **Type:** HTTP Basic Auth
- **Username:** `{{ $env.TWILIO_ACCOUNT_SID }}`
- **Password:** `{{ $env.TWILIO_AUTH_TOKEN }}`

### 4. Ativar Workflow
- Clique no toggle para ativar o workflow
- O webhook estará disponível em: `http://localhost:5678/webhook/whatsapp`

## 🔗 Configuração do Backend

### 1. Verificar Configurações

As configurações já estão em `application-dev.properties`:

```properties
# N8N Configuration
n8n.enabled=true
n8n.base-url=http://localhost:5678
n8n.webhook.url=http://localhost:5678/webhook/whatsapp

# WhatsApp Provider
n8n.whatsapp.provider=wppconnect
n8n.whatsapp.session-name=securedguard
n8n.whatsapp.auto-start=true

# Provider URLs
n8n.wppconnect.url=http://localhost:5678/webhook/wppconnect
n8n.baileys.url=http://localhost:5678/webhook/baileys
n8n.twilio.url=http://localhost:5678/webhook/twilio
```

### 2. Testar Integração

```bash
# Testar envio via backend
curl -X POST http://localhost:8080/api/payslips/send-whatsapp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phoneNumber": "5511999999999",
    "message": "Seu holerite está disponível!",
    "payslipId": 1
  }'
```

## 📊 Monitoramento

### 1. Logs do n8n
```bash
# Ver logs do container
docker logs securedguard-n8n -f
```

### 2. Logs do WPPConnect
```bash
# Ver logs do container
docker logs securedguard-wppconnect -f
```

### 3. Status da Sessão
```bash
# Verificar status da sessão WPPConnect
curl http://localhost:21465/api/sessions/status/securedguard
```

## 🛠️ Solução de Problemas

### n8n não inicia
```bash
# Verificar se a porta está livre
netstat -an | findstr :5678

# Parar containers conflitantes
docker stop $(docker ps -q)
```

### WPPConnect não conecta
1. Verificar se o container está rodando
2. Verificar logs: `docker logs securedguard-wppconnect`
3. Recriar sessão se necessário

### Erro de autenticação
1. Verificar credenciais no n8n
2. Verificar tokens de acesso
3. Reiniciar containers se necessário

### Workflow não responde
1. Verificar se está ativo no n8n
2. Verificar URL do webhook
3. Testar webhook diretamente

## 🔒 Segurança

### 1. Alterar Senhas Padrão
```properties
# No docker-compose ou variáveis de ambiente
N8N_BASIC_AUTH_PASSWORD=sua-senha-segura
WPPCONNECT_SERVER_SECRET=seu-secret-seguro
```

### 2. Configurar HTTPS (Produção)
```properties
N8N_PROTOCOL=https
N8N_HOST=seu-dominio.com
```

### 3. Firewall
- Abrir apenas portas necessárias: 5678, 21465, 3000
- Restringir acesso por IP se necessário

## 📈 Monitoramento Avançado

### 1. Métricas do n8n
- Acesse: http://localhost:5678/metrics
- Configure alertas para falhas

### 2. Logs Estruturados
```bash
# Configurar logs em JSON
docker run -e N8N_LOG_LEVEL=debug ...
```

### 3. Backup de Workflows
```bash
# Backup automático
cp -r C:\n8n-data\workflows backup/
```

## 🎯 Próximos Passos

1. ✅ Configurar n8n
2. ✅ Importar workflow
3. ✅ Configurar credenciais
4. ✅ Testar integração
5. 🔄 Configurar monitoramento
6. 🔄 Implementar backup automático
7. 🔄 Configurar alertas

## 📞 Suporte

- **Documentação n8n:** https://docs.n8n.io/
- **Documentação WPPConnect:** https://wppconnect.io/
- **Issues do projeto:** GitHub Issues

---

**Nota:** Este guia assume que você está usando Windows. Para Linux/Mac, ajuste os comandos conforme necessário. 