# Correção: Erro 522 - Backend Não Iniciando e Timeouts de Email

## Problemas Identificados

### 1. Backend Não Está Iniciando
**Erro:**
```
Failed to configure a DataSource: 'url' attribute is not specified and no embedded datasource could be configured.
```

**Causa:**
- As variáveis de ambiente do banco de dados não estão configuradas corretamente no Docker
- O backend não consegue conectar ao PostgreSQL

**Solução:**
Verificar e configurar as variáveis de ambiente no `docker-compose.ci.yml`:
```yaml
environment:
  - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres-ci:5432/secured_guard_ci
  - SPRING_DATASOURCE_USERNAME=secured_guard_ci
  - SPRING_DATASOURCE_PASSWORD=4KaCiJc6an@7sgbdcid2025
  - SPRING_PROFILES_ACTIVE=ci
```

### 2. Timeouts de Email Constantes
**Erro:**
```
[MessageBroker-1] ERROR c.z.s.service.NotificationService - Erro ao enviar email para colaborador.84417145687@promovervigilancia.com.br: Mail server connection failed. Failed messages: org.eclipse.angus.mail.util.MailConnectException: Couldn't connect to host, port: mail.z7design.com.br, 587; timeout 60000;
```

**Causa:**
- O servidor de email `mail.z7design.com.br:587` não está acessível
- Cada tentativa de envio leva 60 segundos antes de falhar
- Múltiplas tentativas simultâneas estão travando o servidor
- A configuração está usando porta 587 (TLS) mas o `application-ci.properties` está configurado para porta 465 (SSL)

**Solução:**
1. **Reduzir timeout de email** para falhar mais rápido:
```properties
spring.mail.properties.mail.smtp.connectiontimeout=10000
spring.mail.properties.mail.smtp.timeout=10000
spring.mail.properties.mail.smtp.writetimeout=10000
```

2. **Corrigir porta do email** no `application-ci.properties`:
   - A configuração atual usa porta 465 (SSL)
   - Mas os logs mostram tentativas na porta 587 (TLS)
   - Verificar qual porta está sendo usada e corrigir

3. **Desabilitar envio de email em caso de falha**:
   - Adicionar flag para desabilitar emails quando servidor não está disponível
   - Evitar múltiplas tentativas que travam o servidor

4. **Melhorar tratamento assíncrono**:
   - Garantir que envios de email sejam realmente assíncronos
   - Adicionar circuit breaker para evitar tentativas repetidas quando servidor está indisponível

## Ações Imediatas

### 1. Verificar Configuração do Docker Compose
```bash
# Na VPS, verificar docker-compose.ci.yml
cat /var/www/secured_guard/ci/docker-compose.ci.yml | grep -A 20 "backend:"

# Verificar variáveis de ambiente
docker exec secured-guard-backend-ci env | grep SPRING_DATASOURCE
```

### 2. Verificar Status do Banco de Dados
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Testar conexão
docker exec secured-guard-backend-ci ping -c 3 postgres-ci
```

### 3. Verificar Configuração de Email
```bash
# Verificar qual porta está sendo usada
docker exec secured-guard-backend-ci cat /app/application-ci.properties | grep mail.port

# Testar conectividade com servidor de email
docker exec secured-guard-backend-ci nc -zv mail.z7design.com.br 465
docker exec secured-guard-backend-ci nc -zv mail.z7design.com.br 587
```

### 4. Reiniciar Backend com Configurações Corretas
```bash
cd /var/www/secured_guard/ci

# Parar backend
docker-compose -f docker-compose.ci.yml stop backend

# Recriar com novas configurações
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend

# Verificar logs
docker logs secured-guard-backend-ci --tail 100 -f
```

## Melhorias Recomendadas

### 1. Adicionar Health Check para Email
```java
@Scheduled(fixedRate = 300000) // A cada 5 minutos
public void checkEmailServerHealth() {
    try {
        // Testar conexão com servidor de email
        // Se falhar, desabilitar envio de emails temporariamente
    } catch (Exception e) {
        emailEnabled = false;
        log.warn("Servidor de email indisponível. Emails desabilitados.");
    }
}
```

### 2. Implementar Circuit Breaker
- Usar Resilience4j ou similar
- Evitar tentativas repetidas quando servidor está indisponível
- Reativar automaticamente após período de tempo

### 3. Melhorar Logging
- Adicionar métricas de tentativas de envio de email
- Alertar quando taxa de falha for alta
- Monitorar tempo de resposta do servidor de email

## Nota Importante

**O erro 522 constante é causado por:**
1. Backend não iniciando (erro de DataSource)
2. Timeouts de email travando o servidor (60 segundos por tentativa)

**Prioridade:**
1. ✅ Corrigir configuração do banco de dados (CRÍTICO)
2. ✅ Reduzir timeout de email e melhorar tratamento de erros (ALTO)
3. ⏳ Implementar circuit breaker e health checks (MÉDIO)
