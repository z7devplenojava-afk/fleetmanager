# 🔧 Correções Aplicadas - Backend CI Não Inicia

## 🎯 Problemas Identificados

1. **Backend não responde (HTTP 000)**
   - Backend está crashando durante inicialização
   - Flyway migration está falhando com erro PostgreSQL
   - Aplicação nunca completa o startup

2. **Nginx não consegue conectar ao backend**
   - Erro: `connect() failed (111: Connection refused)`
   - Backend não está rodando na porta 8081
   - Health check `/api/health` não está acessível

3. **Configuração de banco de dados incorreta**
   - Database padrão estava como `secured_guard` (deveria ser `secured_guard_ci`)
   - Username padrão estava como `postgres` (deveria ser `secured_guard_ci`)

## ✅ Correções Aplicadas

### 1. Configuração de Banco de Dados Corrigida

**Arquivo:** `backend/src/main/resources/application-ci.properties`

**Antes:**
```properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/secured_guard}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:postgres}
```

**Depois:**
```properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/secured_guard_ci}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:secured_guard_ci}
```

**Nota:** O Docker Compose já define essas variáveis de ambiente corretamente, mas os valores padrão agora estão corretos para execução local ou se as env vars não estiverem definidas.

### 2. Configuração do Flyway Melhorada

Adicionadas configurações de retry para conexões:
```properties
spring.flyway.connect-retries=10
spring.flyway.connect-retries-interval=10
```

Isso ajuda quando há problemas temporários de conexão com o banco.

## 🔍 Próximos Passos para Diagnóstico

### 1. Verificar Logs Completos do Backend

Execute para ver o erro completo do Flyway:
```bash
docker logs secured-guard-backend-ci --tail 100
```

Procure por:
- Erros do Flyway (começam com `Flyway` ou `Migration`)
- Erros do PostgreSQL (geralmente começam com `ERROR:` ou `ERRO:`)
- Stack traces completos

### 2. Verificar Status do Banco de Dados

```bash
# Verificar se o banco está rodando
docker ps | grep postgres-ci

# Verificar conexão
docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "SELECT version();"

# Verificar histórico do Flyway
docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;"
```

### 3. Verificar Migrations Pendentes

Se o Flyway está travado em uma migration específica:

```sql
-- Conectar ao banco
docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci

-- Ver locks do PostgreSQL
SELECT * FROM pg_locks WHERE NOT granted;

-- Desbloquear Flyway (se necessário)
SELECT pg_advisory_unlock_all();

-- Ver última migration executada
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1;
```

### 4. Resetar Banco (Último Recurso)

Se o banco estiver em estado inconsistente:

```bash
# PARAR todos os containers
docker-compose -f docker-compose.ci.yml down

# REMOVER volume do banco (CUIDADO: apaga todos os dados!)
docker volume rm secured-guard-db-ci-data
# OU se estiver usando bind mount:
sudo rm -rf /var/www/secured_guard/ci/postgres_data/*

# RECRIAR containers
docker-compose -f docker-compose.ci.yml up -d
```

## 🚀 Como Testar as Correções

1. **Reconstruir a imagem do backend** (se necessário):
   ```bash
   docker-compose -f docker-compose.ci.yml build backend-ci
   ```

2. **Reiniciar os containers**:
   ```bash
   docker-compose -f docker-compose.ci.yml down
   docker-compose -f docker-compose.ci.yml up -d
   ```

3. **Aguardar inicialização** (pode levar 2-4 minutos para migrations):
   ```bash
   # Monitorar logs
   docker logs -f secured-guard-backend-ci
   ```

4. **Verificar health check**:
   ```bash
   curl http://localhost:8081/api/health
   curl http://localhost:8082/api/health
   ```

## 📋 Checklist de Verificação

- [ ] Backend inicia sem erros
- [ ] Flyway executa migrations com sucesso
- [ ] Health endpoint responde: `curl http://localhost:8081/api/health`
- [ ] Nginx consegue conectar ao backend
- [ ] Health endpoint via Nginx funciona: `curl http://localhost:8082/api/health`
- [ ] Logs não mostram erros de conexão

## 🔗 Referências

- Health Controller: `backend/src/main/java/com/z7design/secured_guard/controller/HealthController.java`
- Nginx Config: `nginx/ci.conf`
- Docker Compose CI: `docker-compose.ci.yml`
- Application CI Config: `backend/src/main/resources/application-ci.properties`

## ⚠️ Notas Importantes

1. **Docker Compose sobrescreve** os valores padrão com variáveis de ambiente, então as correções nos defaults só afetam execução local.

2. **Flyway logs** estão configurados em DEBUG (`logging.level.org.flywaydb.core.internal.command.DbMigrate=DEBUG`), então você deve ver logs detalhados.

3. **Se o problema persistir**, o erro específico do Flyway precisa ser identificado nos logs para correção direcionada.
