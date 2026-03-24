# ✅ WhatsApp Service - Deploy CI Configurado

## 🎯 O Que Foi Feito

### 1. ✅ WhatsApp Service Adicionado ao Docker Compose CI

**Arquivo:** `docker-compose.ci.yml`

```yaml
whatsapp-service-ci:
  image: z7design/secured-guard-whatsapp:ci
  ports:
    - "3333:3333"
  volumes:
    - /var/www/secured_guard/ci/whatsapp_sessions:/app/sessions
    - /var/www/secured_guard/ci/uploads:/app/uploads
  networks:
    - secured-guard-ci-network
```

**Recursos:**
- ✅ Baileys (WhatsApp Web oficial)
- ✅ QR Code generation (SVG e Base64)
- ✅ Envio de mensagens de texto
- ✅ Envio de documentos (PDFs)
- ✅ Webhook para mensagens recebidas
- ✅ Health check endpoint
- ✅ Debug endpoints

### 2. ✅ GitHub Actions Workflow Atualizado

**Arquivo:** `.github/workflows/deploy-ci-docker.yml`

**Adições:**
- ✅ Build da imagem `z7design/secured-guard-whatsapp:ci`
- ✅ Push para Docker Hub
- ✅ Pull na VPS
- ✅ Criação do diretório `/var/www/secured_guard/ci/whatsapp_sessions`
- ✅ Deploy automático junto com backend e frontend

### 3. ✅ Scripts de Teste Local

**Arquivo:** `test-whatsapp-service-local.ps1`

Script PowerShell para testar o serviço localmente antes do deploy.

### 4. ✅ Documentação Completa

**Arquivo:** `GUIA_TESTE_WHATSAPP_CI.md`

Guia completo com:
- Arquitetura do sistema
- Como fazer deploy
- Como obter QR Code
- Como enviar mensagens
- Troubleshooting
- Integração com backend

## 🚀 Como Fazer o Deploy AGORA

### Opção 1: Via Git Push (Automático)

```bash
# 1. Commitar as alterações
git add .
git commit -m "Adicionar WhatsApp Service ao ambiente CI"

# 2. Push para branch CI (trigger automático)
git push origin ci

# 3. Acompanhar no GitHub Actions
# https://github.com/SEU_USUARIO/secured-guard/actions
```

### Opção 2: Via GitHub Interface (Manual)

1. Acesse: https://github.com/SEU_USUARIO/secured-guard/actions
2. Selecione: **"🐳 Deploy CI Environment (Docker Compose)"**
3. Clique: **"Run workflow"**
4. Selecione branch: **ci**
5. Clique: **"Run workflow"**

## 📋 O Que Será Deployado

### Serviços no CI:

1. ✅ **PostgreSQL** (banco de dados)
2. ✅ **Redis** (cache)
3. ✅ **Backend** (API Spring Boot)
4. ✅ **Frontend** (React + Vite)
5. ✅ **Evolution API** (alternativa - desabilitada por padrão)
6. ✅ **WhatsApp Service** (Baileys) ← **NOVO!**
7. ✅ **Nginx** (proxy reverso)

### Imagens Docker:

```
z7design/secured-guard-backend:ci
z7design/secured-guard-frontend:ci
z7design/secured-guard-whatsapp:ci  ← NOVO!
```

### Volumes Criados:

```
/var/www/secured_guard/ci/
├── postgres_data/
├── redis_data/
├── uploads/
├── logs/
├── evolution_instances/
├── holerites/
└── whatsapp_sessions/  ← NOVO!
```

## 🔍 Verificar Deploy

### 1. Verificar Workflow no GitHub
```
✅ Build Backend
✅ Build Frontend
✅ Build WhatsApp Service
✅ Push images to Docker Hub
✅ Transfer files to VPS
✅ Start new containers
✅ Health check
```

### 2. Verificar na VPS

```bash
# Conectar na VPS
ssh usuario@vps-host

# Ver containers rodando
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml ps

# Ver logs do WhatsApp
docker logs -f secured-guard-whatsapp-ci
```

### 3. Testar Endpoints

```bash
# Health check
curl http://VPS_IP:3333/health

# Connection state
curl http://VPS_IP:3333/instance/connectionState

# QR Code (SVG)
curl http://VPS_IP:3333/instance/qr

# QR Code (Base64)
curl http://VPS_IP:3333/instance/qr?format=base64
```

## 📱 Conectar WhatsApp

### 1. Obter QR Code

**Via Backend:**
```bash
curl https://ci.z7botsolutions.com.br/api/whatsapp/qr
```

**Via WhatsApp Service:**
```bash
curl http://VPS_IP:3333/instance/qr
```

### 2. Escanear com WhatsApp

1. Abra o WhatsApp no celular
2. Vá em **Configurações** → **Aparelhos conectados**
3. Toque em **Conectar um aparelho**
4. Escaneie o QR Code

### 3. Verificar Conexão

```bash
curl http://VPS_IP:3333/instance/connectionState
```

**Resposta esperada:**
```json
{"state": "open"}
```

## 💬 Enviar Mensagem de Teste

```bash
curl -X POST http://VPS_IP:3333/message/text \
  -H "Content-Type: application/json" \
  -d '{
    "id": "5511999999999",
    "message": "🎉 WhatsApp Service CI funcionando!"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "jid": "5511999999999@s.whatsapp.net"
}
```

## 📄 Enviar Documento de Teste

```bash
# Primeiro, copie um PDF de teste para o container
docker cp teste.pdf secured-guard-whatsapp-ci:/app/uploads/teste.pdf

# Depois, envie via API
curl -X POST http://VPS_IP:3333/message/document \
  -H "Content-Type: application/json" \
  -d '{
    "id": "5511999999999",
    "filepath": "/app/uploads/teste.pdf",
    "message": "Documento de teste 📄"
  }'
```

## 🔗 Integração com Backend

O backend já está configurado para usar o WhatsApp Service:

**URL interna do Docker:**
```
http://whatsapp-service-ci:3333
```

**Endpoints do Backend:**
- `/api/whatsapp/qr` - Obter QR Code
- `/api/whatsapp/status` - Status da conexão
- `/api/payslips/{id}/send-whatsapp` - Enviar holerite
- `/api/unified-documents/{id}/send-whatsapp` - Enviar documento

## 🎯 Próximos Passos

Após o deploy, você pode:

1. ✅ Conectar WhatsApp escaneando QR Code
2. ✅ Testar envio de mensagem
3. ✅ Testar envio de documento
4. ✅ Implementar envio automático de holerites
5. ✅ Adicionar notificações via WhatsApp
6. ✅ Configurar webhooks para mensagens recebidas

## 📚 Documentação

- **Guia Completo:** `GUIA_TESTE_WHATSAPP_CI.md`
- **Teste Local:** `test-whatsapp-service-local.ps1`
- **Docker Compose:** `docker-compose.ci.yml`
- **GitHub Actions:** `.github/workflows/deploy-ci-docker.yml`

## 🆘 Suporte

Em caso de problemas:

1. Verificar logs: `docker logs secured-guard-whatsapp-ci`
2. Verificar health: `curl http://VPS_IP:3333/health`
3. Verificar volumes: `ls -lh /var/www/secured_guard/ci/whatsapp_sessions/`
4. Reiniciar: `docker-compose -f docker-compose.ci.yml restart whatsapp-service-ci`

## ✨ Recursos do WhatsApp Service

✅ **Baileys** - Biblioteca oficial do WhatsApp Web
✅ **Multi-file auth** - Credenciais persistentes
✅ **QR Code generation** - SVG e Base64
✅ **Envio de texto** - Mensagens simples
✅ **Envio de documentos** - PDFs, imagens, etc
✅ **Webhooks** - Mensagens recebidas
✅ **Health check** - Monitoramento
✅ **Debug endpoints** - Troubleshooting
✅ **Reconnect automático** - Alta disponibilidade
✅ **Docker ready** - Fácil deploy
✅ **CI/CD integrado** - GitHub Actions

---

## 🎉 TUDO PRONTO PARA DEPLOY!

Execute um dos comandos acima para fazer o deploy e testar o envio de mensagens via WhatsApp! 🚀

