# Configuração de Email para Desenvolvimento Local

## Problema
O servidor SMTP `mail.z7design.com.br:465` pode não estar acessível do seu computador local devido a:
- Firewall bloqueando a porta 465
- ISP bloqueando a porta 465
- Servidor SMTP aceitando apenas IPs específicos

## Soluções

### Opção 1: Usar Porta 587 com STARTTLS (Recomendado)

A porta 587 geralmente é menos bloqueada que a 465. Configure as variáveis de ambiente:

**Windows (PowerShell):**
```powershell
$env:MAIL_PORT="587"
$env:MAIL_STARTTLS_ENABLE="true"
$env:MAIL_STARTTLS_REQUIRED="true"
$env:MAIL_SSL_ENABLE="false"
```

**Linux/Mac:**
```bash
export MAIL_PORT=587
export MAIL_STARTTLS_ENABLE=true
export MAIL_STARTTLS_REQUIRED=true
export MAIL_SSL_ENABLE=false
```

### Opção 2: Usar Gmail SMTP (Para Testes)

1. Crie uma senha de app no Google: https://myaccount.google.com/apppasswords
2. Configure as variáveis de ambiente:

**Windows (PowerShell):**
```powershell
$env:MAIL_HOST="smtp.gmail.com"
$env:MAIL_PORT="587"
$env:MAIL_USERNAME="seu-email@gmail.com"
$env:MAIL_PASSWORD="sua-senha-de-app"
$env:MAIL_STARTTLS_ENABLE="true"
$env:MAIL_STARTTLS_REQUIRED="true"
$env:MAIL_SSL_ENABLE="false"
```

### Opção 3: Usar Mailtrap (Para Testes - Recomendado)

1. Crie uma conta gratuita em: https://mailtrap.io
2. Configure as variáveis de ambiente:

**Windows (PowerShell):**
```powershell
$env:MAIL_HOST="smtp.mailtrap.io"
$env:MAIL_PORT="2525"
$env:MAIL_USERNAME="seu-username-mailtrap"
$env:MAIL_PASSWORD="sua-senha-mailtrap"
$env:MAIL_STARTTLS_ENABLE="true"
$env:MAIL_STARTTLS_REQUIRED="false"
$env:MAIL_SSL_ENABLE="false"
```

### Opção 4: Verificar Firewall/Antivírus

1. Verifique se o firewall/antivírus está bloqueando a porta 465
2. Adicione uma exceção para o Java ou para a porta 465
3. Tente desabilitar temporariamente o firewall para testar

### Opção 5: Verificar Conectividade

Teste se consegue conectar ao servidor SMTP:

**Windows (PowerShell):**
```powershell
Test-NetConnection -ComputerName mail.z7design.com.br -Port 465
Test-NetConnection -ComputerName mail.z7design.com.br -Port 587
```

**Linux/Mac:**
```bash
telnet mail.z7design.com.br 465
telnet mail.z7design.com.br 587
```

## Habilitar Debug de Email

Para ver logs detalhados do envio de email:

**Windows (PowerShell):**
```powershell
$env:MAIL_DEBUG="true"
```

**Linux/Mac:**
```bash
export MAIL_DEBUG=true
```

## Reiniciar Aplicação

Após configurar as variáveis de ambiente, reinicie a aplicação Spring Boot para que as mudanças tenham efeito.

