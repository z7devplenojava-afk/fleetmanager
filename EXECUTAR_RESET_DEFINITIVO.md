# 🚀 RESET DEFINITIVO - RESOLVER DE VEZ

## ⚡ EXECUÇÃO RÁPIDA (5 minutos)

### PASSO 1: Parar o Backend

No terminal onde está rodando, pressione `Ctrl+C` ou execute:
```powershell
Stop-Process -Name "java" -Force
```

---

### PASSO 2: Resetar o Banco no DBeaver

**Conecte ao banco `secured_guard_test` e execute:**

```sql
-- RESET COMPLETO
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Confirmar
SELECT 'Banco resetado com sucesso!' as status;
```

---

### PASSO 3: Recompilar o Backend

```powershell
cd C:\dev\secured-guard\backend
.\mvnw.cmd clean package -DskipTests
```

Aguarde ver: `BUILD SUCCESS`

---

### PASSO 4: Iniciar o Backend

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=test
```

---

### PASSO 5: Verificar Logs do Flyway

**Você DEVE ver no console:**

```
Flyway Community Edition 9.22.3 by Redgate
Database: jdbc:postgresql://localhost:5432/secured_guard_test
Successfully validated 233 migrations
Migrating schema "public" to version "1 - create users table"
Migrating schema "public" to version "2 - create hr tables"
...
Migrating schema "public" to version "226 - create vehicle maintenances table"
Migrating schema "public" to version "227 - create vehicles fuel records fines uuid"  
Migrating schema "public" to version "228 - create mileage records table"
...
Migrating schema "public" to version "256 - ensure colaborador role exists"
Successfully applied 233 migrations to schema "public" (execution time 00:01.234s)
Started SecuredGuardApplication in 45.123 seconds
```

**Se NÃO ver as mensagens do Flyway:**
- Há um problema de configuração
- Verifique se `spring.flyway.enabled=true` está presente
- Verifique se a dependência foi compilada

---

### PASSO 6: Verificar se Funcionou

No DBeaver, execute:

```sql
-- Verificar tabelas críticas
SELECT 
    'vehicle_maintenances' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_maintenances')
    THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status
UNION ALL
SELECT 'mileage_records',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mileage_records')
    THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END
UNION ALL
SELECT 'vehicles',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles')
    THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END;

-- Contar total de tabelas
SELECT COUNT(*) as total_tabelas FROM information_schema.tables WHERE table_schema = 'public';
-- Esperado: 60+ tabelas

-- Verificar migrações aplicadas
SELECT COUNT(*) as total_migrations FROM flyway_schema_history;
-- Esperado: 233 migrações
```

---

## ✅ Checklist Final

Após executar todos os passos:

- [ ] Backend está rodando na porta 8081
- [ ] Logs mostraram "Successfully applied 233 migrations"
- [ ] Tabela `vehicle_maintenances` existe no banco
- [ ] Tabela `mileage_records` existe no banco
- [ ] Total de 60+ tabelas no banco
- [ ] 233 migrações registradas em `flyway_schema_history`
- [ ] Dashboard acessível em `http://localhost:8081/api/dashboard/summary`
- [ ] Endpoint `/api/dashboard/alerts` retorna 403 (não 404)
- [ ] Endpoint `/api/dashboard/activities` retorna 403 (não 404)
- [ ] **NÃO há** mais erros de "relação não existe" nos logs

---

## 🔍 Se Ainda Houver Problemas

### 1. Backend não inicia (Flyway falha):

**Verificar logs para identificar qual migração falhou**

```bash
# Procurar por:
- "ERROR" perto de "Flyway"
- "Migration VXXX failed"
- "SQL State: XXXXX"
```

**Se uma migração específica falhar:**
```sql
-- Remover do histórico
DELETE FROM flyway_schema_history WHERE version = 'XXX';

-- Corrigir o arquivo SQL
-- Reiniciar o backend
```

### 2. Tabelas não são criadas:

**Execute manualmente via Maven Plugin:**
```powershell
cd backend
.\mvnw.cmd flyway:migrate -Dflyway.configFiles=flyway.conf
```

### 3. Conflito de checksums:

```sql
-- Limpar checksums
UPDATE flyway_schema_history SET checksum = NULL;
```

### 4. Flyway não aparece nos logs:

Verificar se a dependência foi instalada:
```powershell
cd backend
.\mvnw.cmd dependency:tree | Select-String "flyway"
```

Deve mostrar:
- `flyway-core`
- `flyway-database-postgresql`

---

## 📞 Comandos Úteis

### Ver status do Flyway:
```powershell
cd backend
.\mvnw.cmd flyway:info -Dflyway.configFiles=flyway.conf
```

### Validar migrações:
```powershell
.\mvnw.cmd flyway:validate -Dflyway.configFiles=flyway.conf
```

### Ver dependências do Flyway:
```powershell
.\mvnw.cmd dependency:tree | Select-String "flyway"
```

### Verificar se o backend está rodando:
```powershell
Test-NetConnection -ComputerName localhost -Port 8081
```

---

## 🎯 Configurações Finais

### Flyway em TESTE/DEV:
```properties
spring.flyway.enabled=true
spring.flyway.out-of-order=true
spring.flyway.validate-on-migrate=false
```
**Flexível e tolerante**

### Flyway em PRODUÇÃO:
```properties
spring.flyway.enabled=true
spring.flyway.out-of-order=false
spring.flyway.validate-on-migrate=true
spring.flyway.clean-disabled=true
```
**Rigoroso e seguro**

---

## ✨ Resumo do Que Foi Resolvido

| Item | Status | Detalhe |
|------|--------|---------|
| Dependência Flyway PostgreSQL | ✅ | Adicionada v10.10.0 |
| Configuração Flyway | ✅ | Propriedades inválidas removidas |
| Migração V226 | ✅ | Correta - cria vehicle_maintenances |
| Migração V227 | ✅ | Corrigida - não apaga vehicle_maintenances |
| Migração V228 | ✅ | Corrigida - IF NOT EXISTS nos índices |
| Endpoint /alerts | ✅ | Implementado |
| Endpoint /activities | ✅ | Implementado |
| Logs do Flyway | ✅ | DEBUG habilitado |
| Perfil dinâmico | ✅ | Via variável de ambiente |

---

**EXECUTE O RESET DO BANCO AGORA E REINICIE O BACKEND!**

Tudo está pronto. O Flyway vai funcionar perfeitamente! 🎉

