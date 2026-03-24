# Diagnóstico de Problemas na VPS CI

## 📧 Problema: Email não está enviando

### Status Atual
- ✅ **Configuração correta**: Host, porta, usuário, senha estão configurados
- ✅ **Password detectado**: O sistema reconhece que a senha está configurada
- ❌ **Erro**: `Connect timed out` na porta 465

### Erro nos Logs
```
❌ Erro de mensagem ao enviar email: Couldn't connect to host, port: mail.z7design.com.br, 465; timeout 10000
Causa: Connect timed out
```

### Diagnóstico
O problema **NÃO é de código**, é de **infraestrutura/rede**:
- A VPS não consegue abrir conexão TCP na porta 465 até `mail.z7design.com.br`
- Pode ser bloqueio de firewall do provedor da VPS
- Pode ser bloqueio do servidor de email (whitelist de IPs)

### Testes para Confirmar

**1. Testar conectividade do container:**
```bash
docker exec -it secured-guard-backend-ci sh
apk add --no-cache openssl
openssl s_client -connect mail.z7design.com.br:465 -crlf -quiet
```

**2. Testar da VPS diretamente:**
```bash
telnet mail.z7design.com.br 465
# ou
nc -zv mail.z7design.com.br 465
```

### Soluções Possíveis

#### Opção 1: Liberar porta 465 no provedor
- Abrir chamado com o provedor da VPS pedindo liberação da porta 465 para saída SMTP
- Informar o IP da VPS para whitelist no servidor de email

#### Opção 2: Usar porta 587 (STARTTLS)
Se o provedor só libera porta 587, ajustar variáveis no `docker-compose.ci.yml`:
```yaml
MAIL_PORT: 587
MAIL_STARTTLS_ENABLE: true
MAIL_STARTTLS_REQUIRED: true
MAIL_SSL_ENABLE: false
# Remover MAIL_SOCKET_FACTORY
```

#### Opção 3: Usar servidor SMTP externo
- Gmail com senha de app
- SendGrid
- Amazon SES
- Outro provedor que não bloqueie a VPS

---

## 📲 Problema: QR Code do WhatsApp não está gerando

### Status Atual
- ✅ **Serviço Baileys rodando**: Container `whatsapp-service-ci` está ativo
- ✅ **Backend Java funcionando**: Consegue chamar o serviço Baileys REST
- ❌ **Erro interno do Baileys**: Erro 401 (Unauthorized) ao conectar com WhatsApp

### Erro nos Logs do WhatsApp
```
Connection update: {"connection":"close","qr":null,"error":"Connection Failure"}
Connection closed. Status: 401 Reconnect? false
Error details: Error: Connection Failure
  data: { reason: '401', location: 'lla' }
```

### Diagnóstico
O problema **NÃO é do código Java**, é **interno do Baileys/WhatsApp**:
- O Baileys está tentando autenticar com o WhatsApp e recebendo 401 (Unauthorized)
- Pode ser:
  - Mudança no protocolo do WhatsApp que a versão do Baileys não suporta
  - Conta do WhatsApp com restrições
  - Problema na imagem Docker `z7design/secured-guard-whatsapp:ci`

### Soluções Possíveis

#### Opção 1: Atualizar imagem do Baileys
- Verificar se há versão mais recente da imagem `z7design/secured-guard-whatsapp:ci`
- Atualizar o Baileys para versão mais recente que suporte o protocolo atual do WhatsApp

#### Opção 2: Usar Evolution API
- O sistema já tem suporte para Evolution API configurado em `application-ci.properties`
- Desabilitar Baileys e usar Evolution API:
  ```yaml
  BAILEYS_ENABLED: false
  # Evolution API já está configurado
  ```

#### Opção 3: Verificar logs detalhados
- Verificar logs completos do container WhatsApp para mais detalhes do erro
- Verificar se há atualizações necessárias no código do serviço WhatsApp

---

## 🔍 Próximos Passos

1. **Email**: Testar conectividade com `openssl s_client` e, se não conectar, abrir chamado com provedor
2. **WhatsApp**: Verificar se há atualização da imagem Baileys ou migrar para Evolution API
3. **Monitoramento**: Adicionar alertas para detectar esses problemas automaticamente

---

## 📝 Notas Técnicas

- O código Java está funcionando corretamente
- As configurações estão corretas
- Os problemas são de infraestrutura/rede (email) e protocolo (WhatsApp)
- Não há necessidade de alterar o código Java para resolver esses problemas
