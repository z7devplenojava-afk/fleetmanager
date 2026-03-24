# 📧 Guia de Teste - Sistema de Email CI

## ✅ Email JÁ ESTÁ Configurado!

O sistema de envio de emails já está implementado e configurado com as credenciais fornecidas.

## 📋 Configuração Atual

### **Credenciais:**
```properties
Email: securedguard@z7design.com.br
Senha: sg@2025promover
Servidor SMTP: mail.z7design.com.br
Porta: 465 (SSL/TLS)
```

### **Arquivos Atualizados:**

1. ✅ `application.properties` - Configuração padrão
2. ✅ `application-prod.properties` - Produção
3. ✅ `application-ci.properties` - **CI (ADICIONADO AGORA)**
4. ✅ `EmailService.java` - Serviço de envio
5. ✅ `EmailTestController.java` - **Endpoint de teste (NOVO)**

## 🧪 Como Testar

### 1. **Verificar Configuração**

Após o deploy, execute:

```bash
curl -X GET "https://ci.z7botsolutions.com.br/api/email/config" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta esperada:**
```json
{
  "host": "mail.z7design.com.br",
  "port": "465",
  "username": "securedguard@z7design.com.br",
  "ssl": "true",
  "configured": true
}
```

### 2. **Enviar Email de Teste**

```bash
curl -X POST "https://ci.z7botsolutions.com.br/api/email/test?toEmail=SEU_EMAIL@exemplo.com" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Email enviado com sucesso para SEU_EMAIL@exemplo.com",
  "from": "securedguard@z7design.com.br",
  "to": "SEU_EMAIL@exemplo.com"
}
```

### 3. **Via Frontend (Após Login)**

1. Acesse: https://ci.z7botsolutions.com.br
2. Faça login como SUPER_ADMIN
3. Vá em: **Holerites** ou **Documentos Unificados**
4. Selecione um documento
5. Clique em **Enviar por Email**
6. Digite o email de destino
7. Clique em **Enviar**

## 📧 Endpoints de Email

### **POST /api/email/test**
- **Descrição:** Envia email de teste
- **Parâmetro:** `toEmail` (query param)
- **Permissão:** SUPER_ADMIN ou ADMIN
- **Resposta:** JSON com status do envio

### **GET /api/email/config**
- **Descrição:** Retorna configuração de email
- **Permissão:** SUPER_ADMIN
- **Resposta:** JSON com host, porta, username, ssl

## 🔍 Ver Logs de Email

### Na VPS:

```bash
# Ver logs do backend
docker logs -f secured-guard-backend-ci | grep -i "email\|mail"

# Filtrar apenas sucessos
docker logs secured-guard-backend-ci | grep "Email enviado com sucesso"

# Filtrar apenas erros
docker logs secured-guard-backend-ci | grep "Erro ao enviar email"
```

## 📊 EmailService - Métodos Disponíveis

### 1. **sendUnifiedDocument**
```java
boolean sendUnifiedDocument(
    String toEmail, 
    String employeeName,
    String month, 
    String year, 
    String filePath
)
```
Envia documento unificado por email (sem anexo - apenas notificação).

### 2. **sendEmailWithAttachment**
```java
boolean sendEmailWithAttachment(
    String toEmail,
    String subject,
    String htmlBody,
    byte[] attachmentBytes,
    String attachmentFileName
)
```
Envia email com anexo em bytes (PDF, etc).

## 🎯 Funcionalidades com Email

### ✅ Já Implementadas:

1. **Envio de Documentos Unificados**
   - Endpoint: `POST /api/unified-documents/{id}/send-email`
   - Envia notificação por email

2. **Envio de Holerites**
   - Endpoint: `POST /api/payslips/{id}/send-email`
   - Envia holerite por email

3. **Envio em Lote**
   - Endpoint: `POST /api/unified-documents/send-batch`
   - Envia múltiplos documentos

4. **Teste de Email** ← **NOVO!**
   - Endpoint: `POST /api/email/test`
   - Verifica configuração SMTP

## 🔧 Troubleshooting

### ❌ Erro: "Connection refused"

**Causa:** Firewall bloqueando porta 465

**Solução:** Na VPS, execute:
```bash
sudo ufw allow 465/tcp
sudo ufw allow out 465/tcp
```

### ❌ Erro: "Authentication failed"

**Causa:** Credenciais incorretas

**Solução:** Verificar `application-ci.properties`

### ❌ Erro: "Connection timeout"

**Causa:** Servidor SMTP não acessível

**Solução:** Testar conectividade:
```bash
telnet mail.z7design.com.br 465
```

### ✅ Ver se está funcionando:

```bash
# Na VPS
docker logs secured-guard-backend-ci | grep -A 5 "Enviando.*email"
```

## 📝 Variáveis de Ambiente (Opcional)

Se quiser sobrescrever as credenciais, adicione no `docker-compose.ci.yml`:

```yaml
environment:
  MAIL_HOST: mail.z7design.com.br
  MAIL_PORT: 465
  MAIL_USERNAME: securedguard@z7design.com.br
  MAIL_PASSWORD: sg@2025promover
```

## 🚀 Após Deploy

### Testar no Postman:

**1. Obter Token:**
```
POST https://ci.z7botsolutions.com.br/api/auth/login
Body: { "username": "jose.ramos", "password": "sua_senha" }
```

**2. Testar Email:**
```
POST https://ci.z7botsolutions.com.br/api/email/test?toEmail=seu@email.com
Headers: 
  Authorization: Bearer SEU_TOKEN
```

**3. Ver Configuração:**
```
GET https://ci.z7botsolutions.com.br/api/email/config
Headers:
  Authorization: Bearer SEU_TOKEN
```

## ✨ Recursos do EmailService

✅ **SMTP SSL/TLS** - Conexão segura  
✅ **Autenticação** - Credenciais configuradas  
✅ **Timeout configurado** - 30 segundos  
✅ **HTML Support** - Emails formatados  
✅ **Anexos** - Suporte a PDF e outros arquivos  
✅ **Logs detalhados** - Debug completo  
✅ **Error handling** - Tratamento de erros  
✅ **Retry logic** - Tentativa automática  

---

**📧 Sistema de email pronto para uso no ambiente CI!**

