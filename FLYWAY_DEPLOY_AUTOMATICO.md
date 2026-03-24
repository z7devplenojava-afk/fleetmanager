# ✅ Flyway - Execução Automática de Migrations no Deploy

## 📋 Resposta Rápida

**SIM, a migration V338 será executada automaticamente no próximo deploy!**

O Flyway está configurado corretamente e executará todas as migrations pendentes automaticamente quando a aplicação iniciar.

## 🔧 Configuração Atual

O arquivo `application-ci.properties` está configurado com:

```properties
# ===== FLYWAY =====
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-version=0
spring.flyway.validate-on-migrate=true
spring.flyway.continue-on-error=false
spring.flyway.clean-disabled=true
spring.flyway.out-of-order=false
spring.flyway.ignore-missing-migrations=false
spring.flyway.ignore-future-migrations=false
```

## 🚀 Como Funciona

1. **Quando a aplicação inicia**, o Spring Boot detecta que o Flyway está habilitado
2. **O Flyway verifica** a tabela `flyway_schema_history` no banco de dados
3. **Compara** as migrations já executadas com as migrations disponíveis em `classpath:db/migration`
4. **Executa automaticamente** todas as migrations pendentes (incluindo V338 e V339)
5. **Registra** no histórico do Flyway que as migrations foram executadas

## 📝 Migrations que Serão Executadas

- ✅ **V338__create_unification_jobs_table.sql** - Cria tabela para jobs de unificação assíncrona
- ✅ **V339__create_deletion_jobs_table.sql** - Cria tabela para jobs de exclusão assíncrona

## 🔍 Verificação no Deploy

Após o deploy, você pode verificar nos logs do backend:

```bash
# Ver logs do container backend
docker logs secured-guard-backend-ci | grep -i flyway

# Ou verificar diretamente no banco
docker exec -it postgres-ci psql -U postgres -d secured_guard -c "SELECT * FROM flyway_schema_history WHERE version IN ('338', '339') ORDER BY installed_rank DESC;"
```

Você deve ver mensagens como:
```
Flyway Community Edition 10.x.x by Redgate
Database: jdbc:postgresql://...
Successfully validated X migrations (execution time 00:00.XXXs)
Current version of schema "public": 337
Migrating schema "public" to version "338 - create unification jobs table"
Successfully applied 1 migration to schema "public" (execution time 00:00.XXXs)
Migrating schema "public" to version "339 - create deletion jobs table"
Successfully applied 1 migration to schema "public" (execution time 00:00.XXXs)
```

## ⚠️ Possíveis Problemas e Soluções

### Problema 1: Migration não executou
**Causa:** A migration pode ter falhado silenciosamente
**Solução:** Verifique os logs do backend para erros do Flyway

### Problema 2: Erro de checksum
**Causa:** O arquivo SQL foi modificado após ser executado
**Solução:** Execute manualmente a migration ou ajuste o checksum no histórico

### Problema 3: Tabela já existe
**Causa:** A tabela foi criada manualmente
**Solução:** Registre no histórico do Flyway:
```sql
INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
SELECT 
    COALESCE(MAX(installed_rank), 0) + 1,
    '338',
    'create unification jobs table',
    'SQL',
    'V338__create_unification_jobs_table.sql',
    0,
    current_user,
    CURRENT_TIMESTAMP,
    0,
    true
FROM flyway_schema_history
WHERE NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '338');
```

## 📊 Logging Adicionado

Adicionei logging detalhado do Flyway para facilitar o debug:

```properties
logging.level.org.flywaydb=INFO
logging.level.org.flywaydb.core.internal.command.DbMigrate=DEBUG
```

Isso mostrará informações detalhadas sobre a execução das migrations nos logs.

## ✅ Garantias

1. ✅ **Flyway habilitado** - `spring.flyway.enabled=true`
2. ✅ **Baseline automático** - `spring.flyway.baseline-on-migrate=true`
3. ✅ **Validação ativa** - `spring.flyway.validate-on-migrate=true`
4. ✅ **Migrations no classpath** - Arquivos V338 e V339 estão em `backend/src/main/resources/db/migration/`
5. ✅ **Logging ativo** - Logs do Flyway estarão visíveis

## 🎯 Conclusão

**A migration V338 será executada automaticamente no próximo deploy!**

Não é necessário executar manualmente. O Flyway cuidará disso automaticamente quando a aplicação iniciar.

Se por algum motivo a migration não executar, os logs do Flyway mostrarão o motivo, e você pode executar manualmente usando os scripts fornecidos em `COMO_EXECUTAR_MIGRATION_V338.md`.

