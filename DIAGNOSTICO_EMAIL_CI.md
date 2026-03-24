# 🔍 Diagnóstico: Envio de Emails Falhando no CI

## 📋 Resumo do Problema

O envio de emails ainda está falhando no ambiente CI, mesmo após as correções anteriores.

## 🔎 Possíveis Causas

### 1. **Senha não configurada no GitHub Secrets**

O workflow do GitHub Actions usa `secrets.MAIL_PASSWORD` para definir a senha no arquivo `.env`. Se o secret não estiver configurado, a senha ficará vazia.

**Verificar:**
- Acesse: https://github.com/SEU_REPO/settings/secrets/actions
- Verifique se existe o secret `MAIL_PASSWORD`
- Se não existir, adicione com o valor: `D8rKeqSFZfaS$(y7`

### 2. **Senha com caracteres especiais**

A senha `D8rKeqSFZfaS$(y7` contém caracteres especiais (`$`, `(`, `)`) que podem causar problemas no shell do GitHub Actions.

**Solução:**
O workflow já está usando `printf '%s'` para evitar interpretação de caracteres especiais, mas pode precisar de escape adicional.

### 3. **Configuração SSL/TLS incorreta**

O CI está configurado para usar porta 465 (SSL direto), mas pode haver problemas com a configuração do SocketFactory.

**Verificar no CI:**
```bash
# Verificar configuração de email no container
docker exec secured-guard-backend-ci env | grep MAIL
```

### 4. **Servidor SMTP não acessível**

O servidor `mail.z7design.com.br:465` pode não estar acessível do ambiente CI.

**Testar conectividade:**
```bash
# Na VPS do CI
telnet mail.z7design.com.br 465
# ou
nc -zv mail.z7design.com.br 465
```

### 5. **Timeout muito curto**

Os timeouts estão configurados para 10 segundos, o que pode ser muito curto para o servidor SMTP.

## 🔧 Soluções Propostas

### **Solução 1: Verificar e Configurar GitHub Secret (PRIORITÁRIA)**

1. **Acessar GitHub Secrets:**
   - Repositório → Settings → Secrets and variables → Actions
   - Verificar se `MAIL_PASSWORD` existe
   - Se não existir, criar com valor: `D8rKeqSFZfaS$(y7`

2. **Verificar se o secret está sendo usado:**
   ```bash
   # Na VPS do CI, verificar arquivo .env
   cat /var/www/secured_guard/ci/.env | grep MAIL_PASSWORD
   ```

3. **Se o arquivo .env não tiver a senha:**
   - Executar o workflow do GitHub Actions novamente
   - Ou configurar manualmente na VPS:
     ```bash
     echo 'MAIL_PASSWORD=D8rKeqSFZfaS$(y7' >> /var/www/secured_guard/ci/.env
     docker-compose -f docker-compose.ci.yml restart backend-ci
     ```

### **Solução 2: Aumentar Timeouts**

Se o problema for timeout, aumentar os timeouts no `application-ci.properties`:

```properties
spring.mail.properties.mail.smtp.connectiontimeout=30000
spring.mail.properties.mail.smtp.timeout=30000
spring.mail.properties.mail.smtp.writetimeout=30000
```

### **Solução 3: Testar com Porta 587 (STARTTLS)**

Se a porta 465 não funcionar, tentar porta 587:

1. **Atualizar GitHub Secrets:**
   - `MAIL_PORT`: `587`
   - `MAIL_STARTTLS_ENABLE`: `true`
   - `MAIL_SSL_ENABLE`: `false`
   - `MAIL_SOCKET_FACTORY`: (deixar vazio)

2. **Ou atualizar `application-ci.properties` diretamente:**
   ```properties
   spring.mail.port=${MAIL_PORT:587}
   spring.mail.properties.mail.smtp.starttls.enable=${MAIL_STARTTLS_ENABLE:true}
   spring.mail.properties.mail.smtp.ssl.enable=${MAIL_SSL_ENABLE:false}
   ```

### **Solução 4: Habilitar Debug de Email**

Para ver logs detalhados, habilitar debug:

```properties
spring.mail.properties.mail.debug=true
```

Isso mostrará toda a conversa SMTP nos logs.

## 📊 Verificações no CI

### 1. **Verificar Logs do Backend**

```bash
# Ver logs de email
docker logs secured-guard-backend-ci 2>&1 | grep -i "mail\|email" | tail -50

# Ver logs de erro
docker logs secured-guard-backend-ci 2>&1 | grep -i "erro\|error\|fail" | grep -i "mail\|email" | tail -50
```

### 2. **Verificar Configuração no Container**

```bash
# Ver variáveis de ambiente
docker exec secured-guard-backend-ci env | grep MAIL

# Ver configuração do Spring
docker exec secured-guard-backend-ci cat /app/config/application-ci.properties | grep -A 20 "CONFIGURAÇÃO DE EMAIL"
```

### 3. **Testar Conexão SMTP**

```bash
# Na VPS do CI
docker exec secured-guard-backend-ci sh -c "echo | nc -zv mail.z7design.com.br 465"
```

### 4. **Verificar Arquivo .env**

```bash
# Na VPS do CI
cat /var/www/secured_guard/ci/.env | grep -A 10 "Email Configuration"
```

## 🎯 Checklist de Diagnóstico

- [ ] GitHub Secret `MAIL_PASSWORD` está configurado?
- [ ] Arquivo `.env` na VPS contém `MAIL_PASSWORD`?
- [ ] Container do backend está usando as variáveis de ambiente corretas?
- [ ] Servidor SMTP `mail.z7design.com.br:465` está acessível?
- [ ] Timeouts estão adequados (10s é suficiente)?
- [ ] Configuração SSL/TLS está correta para porta 465?
- [ ] Logs mostram algum erro específico?

## 📝 Próximos Passos

1. ✅ **Verificar GitHub Secrets** (MAIL_PASSWORD)
2. ⏳ **Verificar logs do backend no CI**
3. ⏳ **Verificar arquivo .env na VPS**
4. ⏳ **Testar conectividade SMTP**
5. ⏳ **Se necessário, ajustar configurações**

## 🔗 Referências

- **Workflow GitHub Actions:** `.github/workflows/deploy-ci-docker.yml`
- **Configuração CI:** `backend/src/main/resources/application-ci.properties`
- **MailConfig:** `backend/src/main/java/com/z7design/secured_guard/config/MailConfig.java`
- **EmailTestController:** `backend/src/main/java/com/z7design/secured_guard/controller/EmailTestController.java`
