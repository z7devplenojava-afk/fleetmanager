# 📧 Configuração Email - mail.z7design.com.br

## ✅ Configurações Oficiais do Servidor

### **Credenciais:**
- **Email:** securedguard@z7design.com.br
- **Senha:** D8rKeqSFZfaS$(y7
- **Servidor SMTP:** mail.z7design.com.br
- **Porta SMTP:** 465
- **Protocolo:** SSL/TLS (Secure SSL/TLS Settings - Recomendado)
- **Autenticação:** Requerida (SIM)

### **Portas:**
- **SMTP (Saída):** 465
- **IMAP (Entrada):** 993
- **POP3 (Entrada):** 995

## ✅ Configuração Atual no Código

### **application-ci.properties:**
```properties
spring.mail.host=${MAIL_HOST:mail.z7design.com.br}
spring.mail.port=${MAIL_PORT:465}
spring.mail.username=${MAIL_USERNAME:securedguard@z7design.com.br}
spring.mail.password=${MAIL_PASSWORD:}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=false
spring.mail.properties.mail.smtp.starttls.required=false
spring.mail.properties.mail.smtp.ssl.enable=true
spring.mail.properties.mail.smtp.ssl.trust=*
spring.mail.properties.mail.smtp.ssl.protocols=TLSv1.2,TLSv1.3
spring.mail.properties.mail.smtp.socketFactory.class=javax.net.ssl.SSLSocketFactory
spring.mail.properties.mail.smtp.socketFactory.port=465
spring.mail.properties.mail.smtp.socketFactory.fallback=false
```

### **MailConfig.java:**
- ✅ SocketFactory configurado para porta 465
- ✅ SSL habilitado
- ✅ STARTTLS desabilitado (correto para porta 465)
- ✅ `mail.smtp.ssl.checkserveridentity=false` (adicionado)
- ✅ `mail.smtp.ssl.protocols=TLSv1.2,TLSv1.3` (adicionado)

### **GitHub Actions Secrets:**
- ✅ `MAIL_HOST=mail.z7design.com.br`
- ✅ `MAIL_PORT=465`
- ✅ `MAIL_USERNAME=securedguard@z7design.com.br`
- ✅ `MAIL_PASSWORD=D8rKeqSFZfaS$(y7`

## 🔍 Análise do Problema

### **Sintoma:**
- Timeout ao conectar ao servidor SMTP
- Erro: `Couldn't connect to host, port: mail.z7design.com.br, 465; timeout 30000`
- Ocorre tanto local quanto no CI

### **Possíveis Causas:**

1. **Servidor bloqueando conexões JavaMail:**
   - O servidor pode estar bloqueando conexões de clientes JavaMail
   - Pode requerer whitelist de IPs
   - Pode bloquear conexões que não sejam de clientes de email padrão

2. **Firewall/Rede:**
   - Firewall do servidor bloqueando porta 465
   - Restrições de rede no CI
   - Porta 465 bloqueada no ambiente

3. **Certificado SSL:**
   - Problemas com certificado SSL do servidor
   - Validação de certificado falhando (já adicionado `checkserveridentity=false`)

4. **Timeouts muito curtos:**
   - 10 segundos pode ser insuficiente
   - Servidor pode estar lento para responder

## 🔧 Soluções Testadas/Implementadas

### ✅ **1. Configuração SSL Correta:**
- SocketFactory configurado para porta 465
- SSL habilitado
- STARTTLS desabilitado (correto para porta 465)

### ✅ **2. Propriedades SSL Adicionais:**
- `mail.smtp.ssl.checkserveridentity=false` - Confiar no certificado
- `mail.smtp.ssl.protocols=TLSv1.2,TLSv1.3` - Protocolos SSL

### ✅ **3. Secrets Configuradas no GitHub:**
- Todas as variáveis estão configuradas corretamente

## 🚀 Próximas Ações Recomendadas

### **1. Verificar com Administrador do Servidor:**
- Confirmar se o servidor aceita conexões JavaMail
- Verificar se há whitelist de IPs necessário
- Verificar logs do servidor SMTP para ver tentativas de conexão

### **2. Testar Conectividade:**
```bash
# No CI, testar conectividade
telnet mail.z7design.com.br 465
# ou
nc -zv mail.z7design.com.br 465
```

### **3. Aumentar Timeouts (já implementado localmente):**
- Timeouts locais: 30 segundos
- Timeouts CI: 10 segundos (podem ser aumentados)

### **4. Habilitar Debug Temporariamente:**
```properties
spring.mail.properties.mail.debug=true
```
Isso mostrará toda a conversa SMTP nos logs.

### **5. Testar com Porta 587 (STARTTLS):**
Se a porta 465 não funcionar, tentar porta 587:
- Mudar `MAIL_PORT=587`
- `MAIL_STARTTLS_ENABLE=true`
- `MAIL_SSL_ENABLE=false`

## 📊 Status Atual

| Item | Status | Observação |
|------|--------|------------|
| Configuração JavaMail | ✅ | Correta para porta 465 SSL |
| Secrets GitHub Actions | ✅ | Todas configuradas |
| SocketFactory | ✅ | Configurado corretamente |
| SSL/TLS | ✅ | Habilitado e configurado |
| Autenticação | ✅ | Habilitada |
| Conectividade | ❌ | Timeout ao conectar |
| Envio de Email | ❌ | Falha por timeout |

## 🔗 Referências

- **Código MailConfig:** `backend/src/main/java/com/z7design/secured_guard/config/MailConfig.java`
- **Configuração CI:** `backend/src/main/resources/application-ci.properties`
- **Workflow GitHub:** `.github/workflows/deploy-ci-docker.yml`
