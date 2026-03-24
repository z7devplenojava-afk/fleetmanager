# 🔧 Solução para Problema de Timeout no Envio de Email

## Problema Identificado

O erro `Connection timed out: getsockopt` ou `Couldn't connect to host, port: mail.z7design.com.br, 587; timeout 60000` indica que:

1. **O servidor SMTP não está acessível** do seu ambiente local (firewall, ISP ou rede bloqueando)
2. **Timeout de conexão** após 60 segundos (configurado)
3. **A porta 587 pode estar bloqueada** pelo firewall ou antivírus

### Erro Típico no Log:
```
ERROR c.z.s.service.EmailService - ❌ Erro de mensagem ao enviar email com anexo para z7designcode@gmail.com: Couldn't connect to host, port: mail.z7design.com.br, 587; timeout 60000
ERROR c.z.s.service.EmailService - Causa: Connection timed out: getsockopt
```

### Resposta da API:
```json
{
  "success": false,
  "message": "Timeout ao conectar ao servidor SMTP mail.z7design.com.br:587",
  "error": "MESSAGING_EXCEPTION",
  "suggestion": "A conexão com o servidor SMTP expirou após 60 segundos. Possíveis causas:\n1. Servidor SMTP não está acessível da sua rede\n2. Firewall bloqueando a porta 587\n3. Para desenvolvimento local, use um servidor SMTP alternativo (Gmail ou Mailtrap)"
}
```

## ✅ Solução Rápida (Recomendada)

### Opção 1: Usar Porta 587 com STARTTLS (Mais Compatível)

A porta 587 geralmente é menos bloqueada que a 465. Configure as variáveis de ambiente:

**Windows (PowerShell):**
```powershell
$env:MAIL_PORT="587"
$env:MAIL_STARTTLS_ENABLE="true"
$env:MAIL_STARTTLS_REQUIRED="true"
$env:MAIL_SSL_ENABLE="false"
$env:MAIL_CONNECTION_TIMEOUT="60000"
```

**Linux/Mac:**
```bash
export MAIL_PORT=587
export MAIL_STARTTLS_ENABLE=true
export MAIL_STARTTLS_REQUIRED=true
export MAIL_SSL_ENABLE=false
export MAIL_CONNECTION_TIMEOUT=60000
```

**Depois, reinicie o backend.**

### Opção 2: Usar Gmail SMTP (Para Testes)

Se o servidor Z7Design não estiver acessível, use Gmail temporariamente:

1. **Crie uma senha de app no Google**: https://myaccount.google.com/apppasswords
2. **Configure as variáveis de ambiente:**

**Windows (PowerShell):**
```powershell
$env:MAIL_HOST="smtp.gmail.com"
$env:MAIL_PORT="587"
$env:MAIL_USERNAME="seu-email@gmail.com"
$env:MAIL_PASSWORD="xxxx xxxx xxxx xxxx"  # Senha de app gerada
$env:MAIL_STARTTLS_ENABLE="true"
$env:MAIL_STARTTLS_REQUIRED="true"
$env:MAIL_SSL_ENABLE="false"
```

**Linux/Mac:**
```bash
export MAIL_HOST=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=seu-email@gmail.com
export MAIL_PASSWORD="xxxx xxxx xxxx xxxx"
export MAIL_STARTTLS_ENABLE=true
export MAIL_STARTTLS_REQUIRED=true
export MAIL_SSL_ENABLE=false
```

### Opção 3: Usar Mailtrap (Para Testes - Recomendado)

Mailtrap intercepta emails sem enviá-los realmente (ideal para desenvolvimento):

1. **Crie conta gratuita**: https://mailtrap.io
2. **Configure as variáveis de ambiente:**

**Windows (PowerShell):**
```powershell
$env:MAIL_HOST="smtp.mailtrap.io"
$env:MAIL_PORT="2525"
$env:MAIL_USERNAME="seu-username-mailtrap"
$env:MAIL_PASSWORD="sua-senha-mailtrap"
$env:MAIL_STARTTLS_ENABLE="true"
$env:MAIL_SSL_ENABLE="false"
```

**Linux/Mac:**
```bash
export MAIL_HOST=smtp.mailtrap.io
export MAIL_PORT=2525
export MAIL_USERNAME=seu-username-mailtrap
export MAIL_PASSWORD=sua-senha-mailtrap
export MAIL_STARTTLS_ENABLE=true
export MAIL_SSL_ENABLE=false
```

## 🔍 Verificação de Conectividade

### Teste se consegue conectar ao servidor SMTP:

**Windows (PowerShell):**
```powershell
# Teste porta 587 (STARTTLS)
Test-NetConnection -ComputerName mail.z7design.com.br -Port 587

# Teste porta 465 (SSL direto)
Test-NetConnection -ComputerName mail.z7design.com.br -Port 465

# Se ambos falharem com "TcpTestSucceeded: False", o servidor não está acessível
```

**Linux/Mac:**
```bash
# Teste porta 587
telnet mail.z7design.com.br 587
# Ou use nc (netcat)
nc -zv mail.z7design.com.br 587

# Teste porta 465
telnet mail.z7design.com.br 465
# Ou use nc
nc -zv mail.z7design.com.br 465
```

**Se ambos falharem**, o servidor não está acessível do seu ambiente. Nesse caso:
- Use um servidor SMTP alternativo (Gmail, Mailtrap) para desenvolvimento
- Verifique se há firewall/antivírus bloqueando
- Verifique se sua rede/ISP permite conexões SMTP
- Considere usar VPN se o servidor só aceita IPs específicos

## 🛠️ Solução Permanente

### Criar arquivo `.env` no diretório `backend/`:

```properties
MAIL_HOST=mail.z7design.com.br
MAIL_PORT=587
MAIL_USERNAME=securedguard@z7design.com.br
MAIL_PASSWORD=sg@2025promover
MAIL_STARTTLS_ENABLE=true
MAIL_STARTTLS_REQUIRED=true
MAIL_SSL_ENABLE=false
MAIL_CONNECTION_TIMEOUT=60000
MAIL_TIMEOUT=60000
MAIL_WRITE_TIMEOUT=60000
MAIL_DEBUG=false
```

O Spring Boot carregará automaticamente essas variáveis.

## 📝 Configuração Atual

A configuração padrão foi alterada para:
- **Porta**: 587 (em vez de 465)
- **STARTTLS**: Habilitado
- **SSL direto**: Desabilitado
- **Timeout**: Aumentado para 60 segundos

Isso deve resolver o problema de timeout na maioria dos casos.

## ⚠️ Se Ainda Não Funcionar

1. **Verifique firewall/antivírus**: Pode estar bloqueando conexões SMTP
2. **Verifique rede corporativa**: Algumas redes bloqueiam portas SMTP
3. **Use VPN**: Se o servidor só aceita IPs específicos
4. **Contate administrador**: O servidor pode precisar liberar seu IP

## 🧪 Teste a Configuração

Após configurar, teste enviando um email de teste através do endpoint:
```
POST /api/email/test?toEmail=seu-email@exemplo.com
```

Ou use o endpoint de teste:
```
GET /api/email/test?toEmail=seu-email@exemplo.com
```

## ✨ Melhorias Implementadas

### Tratamento de Erros Aprimorado

O sistema agora fornece mensagens de erro mais detalhadas e úteis:

1. **Detecção de tipo de erro**: O sistema identifica se é problema de:
   - Autenticação (credenciais incorretas)
   - Conexão (servidor inacessível)
   - Timeout (conexão expirou)

2. **Sugestões automáticas**: A API retorna sugestões específicas baseadas no tipo de erro:
   - Para timeout: sugere verificar firewall, usar servidor alternativo
   - Para autenticação: sugere verificar credenciais
   - Para conexão: sugere verificar host, porta e acessibilidade

3. **Logs detalhados**: Os logs do backend agora incluem:
   - Tipo específico de erro
   - Causa raiz do problema
   - Sugestões de solução
   - Informações de configuração SMTP

### Exemplo de Resposta de Erro Melhorada:

```json
{
  "success": false,
  "message": "Timeout ao conectar ao servidor SMTP mail.z7design.com.br:587",
  "error": "MESSAGING_EXCEPTION",
  "details": "Couldn't connect to host, port: mail.z7design.com.br, 587; timeout 60000",
  "suggestion": "A conexão com o servidor SMTP expirou após 60 segundos. Possíveis causas:\n1. Servidor SMTP não está acessível da sua rede\n2. Firewall bloqueando a porta 587\n3. Para desenvolvimento local, use um servidor SMTP alternativo (Gmail ou Mailtrap)",
  "smtp_host": "mail.z7design.com.br",
  "smtp_port": "587"
}
```

