# 🔧 Guia de Teste de Email Local

## Problema: Timeout na Conexão SMTP

Se você está recebendo timeout ao conectar ao servidor SMTP, tente estas soluções:

## ✅ Solução 1: Usar Porta 587 com STARTTLS (Recomendado)

A porta 587 é menos bloqueada por firewalls e ISPs. Configure as variáveis de ambiente:

### Windows (PowerShell):
```powershell
$env:MAIL_PORT="587"
$env:MAIL_STARTTLS_ENABLE="true"
$env:MAIL_STARTTLS_REQUIRED="true"
$env:MAIL_SSL_ENABLE="false"
$env:MAIL_CONNECTION_TIMEOUT="30000"
```

### Linux/Mac:
```bash
export MAIL_PORT=587
export MAIL_STARTTLS_ENABLE=true
export MAIL_STARTTLS_REQUIRED=true
export MAIL_SSL_ENABLE=false
export MAIL_CONNECTION_TIMEOUT=30000
```

**Depois, reinicie o backend.**

## ✅ Solução 2: Usar Porta 465 (SSL Direto)

Se a porta 587 não funcionar, tente a porta 465:

### Windows (PowerShell):
```powershell
$env:MAIL_PORT="465"
$env:MAIL_STARTTLS_ENABLE="false"
$env:MAIL_STARTTLS_REQUIRED="false"
$env:MAIL_SSL_ENABLE="true"
$env:MAIL_CONNECTION_TIMEOUT="30000"
```

### Linux/Mac:
```bash
export MAIL_PORT=465
export MAIL_STARTTLS_ENABLE=false
export MAIL_STARTTLS_REQUIRED=false
export MAIL_SSL_ENABLE=true
export MAIL_CONNECTION_TIMEOUT=30000
```

## 📋 Configurações Atuais

- **Servidor:** mail.z7design.com.br
- **Email:** securedguard@z7design.com.br
- **Senha:** D8rKeqSFZfaS$(y7
- **Porta padrão:** 587 (STARTTLS)
- **Timeout:** 30 segundos

## 🔍 Verificar Conectividade

Teste se o servidor está acessível:

### Windows:
```powershell
Test-NetConnection -ComputerName mail.z7design.com.br -Port 587
Test-NetConnection -ComputerName mail.z7design.com.br -Port 465
```

### Linux/Mac:
```bash
telnet mail.z7design.com.br 587
telnet mail.z7design.com.br 465
```

## ⚠️ Se Nenhuma Porta Funcionar

1. **Verifique firewall/antivírus** - pode estar bloqueando conexões SMTP
2. **Verifique rede/ISP** - alguns ISPs bloqueiam portas SMTP
3. **Use VPN** - pode contornar bloqueios de rede
4. **Teste de outra rede** - confirme se é problema de rede local

## 📝 Notas

- O timeout foi aumentado para 30 segundos para desenvolvimento local
- A porta 587 (STARTTLS) é geralmente mais compatível
- A porta 465 (SSL direto) pode ser bloqueada por alguns firewalls
