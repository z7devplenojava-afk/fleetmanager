# 📧 Configuração de Email SMTP

## Problema Atual

O erro `500 /communication-test/email/simple` ocorre porque o servidor SMTP não está configurado corretamente.

## Solução Rápida

### Opção 1: Gmail (Recomendado para Desenvolvimento)

1. **Habilite autenticação de 2 fatores** na sua conta Google
2. **Crie uma "Senha de App"**: https://myaccount.google.com/apppasswords
3. **Configure as variáveis de ambiente**:

```bash
# Windows (PowerShell)
$env:MAIL_HOST="smtp.gmail.com"
$env:MAIL_PORT="587"
$env:MAIL_USERNAME="seu_email@gmail.com"
$env:MAIL_PASSWORD="xxxx xxxx xxxx xxxx"  # Senha de App gerada

# Linux/Mac
export MAIL_HOST="smtp.gmail.com"
export MAIL_PORT="587"
export MAIL_USERNAME="seu_email@gmail.com"
export MAIL_PASSWORD="xxxx xxxx xxxx xxxx"
```

4. **Reinicie o backend**

### Opção 2: Mailtrap (Para Testes Sem Envio Real)

Mailtrap é um serviço que intercepta emails de teste sem enviá-los realmente.

1. **Crie conta gratuita**: https://mailtrap.io
2. **Pegue as credenciais SMTP** do inbox de teste
3. **Configure**:

```bash
$env:MAIL_HOST="smtp.mailtrap.io"
$env:MAIL_PORT="2525"
$env:MAIL_USERNAME="seu_usuario_mailtrap"
$env:MAIL_PASSWORD="sua_senha_mailtrap"
```

### Opção 3: Outro Servidor SMTP

Se você tem um servidor SMTP próprio:

```bash
$env:MAIL_HOST="smtp.seuprovedor.com"
$env:MAIL_PORT="587"  # ou 465 para SSL
$env:MAIL_USERNAME="seu_email@dominio.com"
$env:MAIL_PASSWORD="sua_senha"
```

## Configuração Permanente

### Usando arquivo .env

1. Copie `.env.example` para `.env`
2. Preencha as configurações de email
3. O Spring Boot carregará automaticamente

### Editando application.properties

Edite `backend/src/main/resources/application.properties`:

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=seu_email@gmail.com
spring.mail.password=sua_senha_de_app
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

## Verificação

### 1. Verifique as configurações no sistema

Acesse: `GET /api/communication-test/email/config`

Resposta esperada:
```json
{
  "from": "seu_email@gmail.com",
  "host": "smtp.gmail.com",
  "port": "587",
  "configured": true,
  "status": "configured"
}
```

### 2. Teste o envio

Use a interface de Configurações → Testes → Teste de Email

Ou via API:
```bash
POST /api/communication-test/email/simple
?toEmail=destino@example.com
&subject=Teste
&message=Mensagem de teste
```

## Troubleshooting

### Erro: "Authentication failed"
- ✅ Verifique se o usuário e senha estão corretos
- ✅ Para Gmail, use "Senha de App", não sua senha normal
- ✅ Verifique se `mail.smtp.auth=true`

### Erro: "Connection timeout"
- ✅ Verifique se o host e porta estão corretos
- ✅ Verifique firewall/antivírus
- ✅ Para Gmail, use porta 587 (TLS) ou 465 (SSL)

### Erro: "SSL/TLS required"
- ✅ Habilite `mail.smtp.starttls.enable=true`
- ✅ Ou use porta 465 com SSL

## Configurações Testadas

### Gmail (Funciona)
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=seu_email@gmail.com
spring.mail.password=senha_de_app
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Outlook/Hotmail (Funciona)
```properties
spring.mail.host=smtp-mail.outlook.com
spring.mail.port=587
spring.mail.username=seu_email@outlook.com
spring.mail.password=sua_senha
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Mailtrap (Para Testes)
```properties
spring.mail.host=smtp.mailtrap.io
spring.mail.port=2525
spring.mail.username=seu_usuario_mailtrap
spring.mail.password=sua_senha_mailtrap
spring.mail.properties.mail.smtp.auth=true
```

## Logs Úteis

Quando o email for enviado, você verá nos logs:

```
🧪 Enviando email de teste para: destino@example.com
Assunto: Teste do Sistema SecuredGuard
De: remetente@example.com
📤 Tentando enviar email via SMTP...
✅ Email de teste enviado com sucesso para: destino@example.com
```

Se houver erro:

```
💥 MailException ao enviar email de teste: Could not connect to SMTP host
Causa: Connection refused
```

Isso indica que o servidor SMTP não está acessível.

