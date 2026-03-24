# 📱 Guia de Teste - WhatsApp Service CI

## 🎯 Visão Geral

O WhatsApp Service usa **Baileys** (biblioteca oficial do WhatsApp Web) e está totalmente integrado ao ambiente CI.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│                 Secured Guard                   │
│                                                 │
│  ┌──────────────┐      ┌──────────────────┐   │
│  │   Backend    │ ───► │ WhatsApp Service │   │
│  │   (8081)     │      │     (3333)       │   │
│  └──────────────┘      └──────────────────┘   │
│         │                        │              │
│         │                        │              │
│         ▼                        ▼              │
│  ┌──────────────┐      ┌──────────────────┐   │
│  │  PostgreSQL  │      │  Sessions Dir    │   │
│  │   (5432)     │      │   (Baileys)      │   │
│  └──────────────┘      └──────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 🚀 Deploy via GitHub Actions

### 1. Push para branch CI
```bash
git add .
git commit -m "Adicionar WhatsApp Service CI"
git push origin ci
```

### 2. Verificar deploy no GitHub Actions
- Acesse: https://github.com/SEU_USUARIO/secured-guard/actions
- Aguarde o workflow **"🐳 Deploy CI Environment (Docker Compose)"** completar

## 🔍 Verificar Status na VPS

### 1. Conectar na VPS
```bash
ssh usuario@vps-host
```

### 2. Verificar containers rodando
```bash
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml ps
```

Você deve ver:
```
NAME                          STATUS
secured-guard-whatsapp-ci     Up (healthy)
secured-guard-backend-ci      Up (healthy)
secured-guard-frontend-ci     Up (healthy)
```

### 3. Verificar logs do WhatsApp Service
```bash
docker logs -f secured-guard-whatsapp-ci
```

Você verá:
```
WhatsApp service running on port 3333
✅ Usando versão mais recente do Baileys: [2, 3000, ...]
```

## 📱 Obter QR Code

### Método 1: Através do Backend (Recomendado)
```bash
curl https://ci.z7botsolutions.com.br/api/whatsapp/qr
```

### Método 2: Diretamente no WhatsApp Service
```bash
# QR Code SVG
curl http://VPS_IP:3333/instance/qr

# QR Code Base64 (para frontend)
curl http://VPS_IP:3333/instance/qr?format=base64
```

### Método 3: Logs do container
```bash
docker logs secured-guard-whatsapp-ci
```

O QR Code ASCII aparecerá nos logs (graças ao `printQRInTerminal: true`).

## ✅ Testar Conexão

### 1. Verificar estado da conexão
```bash
curl http://VPS_IP:3333/instance/connectionState
```

**Antes de escanear:**
```json
{"state": "closed"}
```

**Depois de escanear:**
```json
{"state": "open"}
```

### 2. Verificar health
```bash
curl http://VPS_IP:3333/health
```

```json
{
  "status": "ok",
  "ready": true
}
```

## 📤 Enviar Mensagens de Teste

### 1. Mensagem de Texto
```bash
curl -X POST http://VPS_IP:3333/message/text \
  -H "Content-Type: application/json" \
  -d '{
    "id": "5511999999999",
    "message": "Olá! Mensagem de teste do Secured Guard CI 🎉"
  }'
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "jid": "5511999999999@s.whatsapp.net"
}
```

### 2. Enviar Documento (PDF)
```bash
curl -X POST http://VPS_IP:3333/message/document \
  -H "Content-Type: application/json" \
  -d '{
    "id": "5511999999999",
    "filepath": "/app/uploads/holerites/exemplo.pdf",
    "message": "Seu holerite está anexo 📄"
  }'
```

## 🔧 Debug e Troubleshooting

### 1. Ver formato JID
```bash
curl "http://VPS_IP:3333/debug/jid?id=5511999999999"
```

```json
{
  "id": "5511999999999",
  "jid": "5511999999999@s.whatsapp.net"
}
```

### 2. Ver mensagens recebidas (inbox)
```bash
curl http://VPS_IP:3333/debug/inbox
```

```json
{
  "count": 2,
  "messages": [
    {
      "from": "5511999999999@s.whatsapp.net",
      "text": "Oi",
      "fromMe": false,
      "timestamp": 1730745600
    }
  ]
}
```

### 3. Resetar conexão (logout)
```bash
curl -X POST http://VPS_IP:3333/instance/logout
```

Isso remove as credenciais salvas e requer novo QR Code.

## 🔗 Integração com Backend

O backend se comunica com o WhatsApp Service através da URL interna do Docker:
```
http://whatsapp-service-ci:3333
```

### Endpoints do Backend que usam WhatsApp:

1. **Obter QR Code:**
   ```
   GET /api/whatsapp/qr
   ```

2. **Verificar Conexão:**
   ```
   GET /api/whatsapp/status
   ```

3. **Enviar Holerite:**
   ```
   POST /api/payslips/{id}/send-whatsapp
   ```

4. **Enviar Documento Unificado:**
   ```
   POST /api/unified-documents/{id}/send-whatsapp
   ```

## 📊 Monitoramento

### Verificar uso de recursos
```bash
docker stats secured-guard-whatsapp-ci
```

### Verificar volumes montados
```bash
ls -lh /var/www/secured_guard/ci/whatsapp_sessions/
```

Deve conter:
```
securedguard_ci/
  ├── creds.json
  └── app-state-sync-*.json
```

## 🚨 Problemas Comuns

### ❌ Container não inicia
```bash
docker logs secured-guard-whatsapp-ci
```

**Solução:** Verificar se a porta 3333 não está em uso.

### ❌ QR Code não aparece
**Solução:** Aguardar 10-15 segundos após iniciar o container.

### ❌ "Client not ready"
**Causa:** WhatsApp não está conectado.
**Solução:** Escanear o QR Code primeiro.

### ❌ Arquivo não encontrado ao enviar documento
**Causa:** O arquivo PDF não existe no path especificado.
**Solução:** Verificar se o volume está montado corretamente:
```bash
docker exec secured-guard-whatsapp-ci ls -lh /app/uploads
```

## 📝 Variáveis de Ambiente

No `docker-compose.ci.yml`:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `PORT` | 3333 | Porta do serviço |
| `INSTANCE_KEY` | securedguard_ci | Nome da instância |
| `SESSION_DIR` | /app/sessions | Diretório das credenciais |
| `WEBHOOK_URL` | http://backend-ci:8081/api/whatsapp/webhook | Webhook para mensagens recebidas |
| `NODE_ENV` | production | Ambiente |

## 🎉 Teste Completo - Passo a Passo

1. ✅ Deploy via GitHub Actions
2. ✅ Verificar container rodando
3. ✅ Obter QR Code
4. ✅ Escanear com WhatsApp
5. ✅ Verificar conexão aberta
6. ✅ Enviar mensagem de teste
7. ✅ Enviar documento de teste
8. ✅ Verificar logs

## 📞 URLs Importantes

- **Frontend CI:** https://ci.z7botsolutions.com.br
- **Backend CI:** https://ci.z7botsolutions.com.br/api
- **WhatsApp Service:** http://VPS_IP:3333 (interno)
- **GitHub Actions:** https://github.com/SEU_USUARIO/secured-guard/actions

## ✨ Próximos Passos

Após testar no CI, você pode:
1. Implementar envio automático de holerites
2. Adicionar notificações via WhatsApp
3. Implementar respostas automáticas
4. Adicionar webhooks personalizados
5. Escalar para produção

---

**🎯 Objetivo:** Ter o WhatsApp Service totalmente funcional no ambiente CI, pronto para enviar documentos e mensagens!

