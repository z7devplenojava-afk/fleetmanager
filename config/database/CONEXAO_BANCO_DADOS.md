# 🔗 Guia de Conexão com Banco de Dados - SecuredGuard

Este guia explica como configurar e conectar aos bancos de dados do projeto SecuredGuard.

## 📋 **Estrutura dos Bancos**

O projeto utiliza múltiplos bancos de dados para diferentes ambientes:

| Ambiente | Banco | Porta | Usuário | Finalidade |
|----------|-------|-------|---------|------------|
| **Desenvolvimento** | `secured_guard_dev` | 5432 | `postgressg` | Desenvolvimento local |
| **Teste** | `secured_guard_test` | 5432 | `postgressg` | Testes automatizados |
| **Staging** | `secured_guard_staging` | 5432 | `postgressg` | Ambiente de homologação |
| **Produção** | `secured_guard_prod` | 5432 | `postgressg` | Ambiente de produção |
| **CI/CD** | `secured_guard_ci` | 5432 | `postgressg` | Integração contínua |

## 🚀 **Configuração Inicial**

### **1. Criar Bancos de Dados**

Execute um dos scripts para criar todos os bancos:

```bash
# Linux/Mac
./scripts/create-databases.sh

# Windows PowerShell
.\scripts\create-databases.ps1
```

### **2. Configurar Variáveis de Ambiente**

Copie o template e configure para seu ambiente:

```bash
# Copiar template
cp config/environments/env.template config/environments/.env.dev

# Editar configurações
nano config/environments/.env.dev
```

### **3. Gerar Senhas Seguras**

```bash
# Linux/Mac
./scripts/generate-passwords.sh

# Windows PowerShell
.\scripts\generate-passwords.ps1
```

## 🔧 **Configuração do DBeaver**

### **Conexão Local (Desenvolvimento)**

1. **Nova Conexão PostgreSQL**
2. **Configurações:**
   - **Host:** `localhost`
   - **Porta:** `5432`
   - **Database:** `secured_guard_dev`
   - **Username:** `postgressg`
   - **Password:** [senha do arquivo .env.dev]

### **Conexão via SSH Tunnel (VPS)**

1. **Nova Conexão PostgreSQL**
2. **Aba SSH:**
   - ✅ **Use SSH Tunnel**
   - **Host/IP:** `IP_DA_VPS`
   - **Port:** `22`
   - **User Name:** `usuario_vps`
   - **Authentication:** Password ou Key Pair

3. **Aba Principal:**
   - **Host:** `localhost`
   - **Porta:** `5432`
   - **Database:** `secured_guard_prod`
   - **Username:** `postgressg`
   - **Password:** [senha do arquivo .env.prod]

## 🐳 **Docker Compose**

### **Desenvolvimento**

```bash
# Iniciar ambiente de desenvolvimento
docker-compose -f deploy/docker-compose.dev.yml up -d

# Verificar logs
docker-compose -f deploy/docker-compose.dev.yml logs postgres
```

### **Produção**

```bash
# Iniciar ambiente de produção
docker-compose -f deploy/docker-compose.prod.yml up -d

# Verificar status
docker-compose -f deploy/docker-compose.prod.yml ps
```

## 🔍 **Comandos Úteis**

### **Conectar via psql**

```bash
# Desenvolvimento
psql -h localhost -p 5432 -U postgressg -d secured_guard_dev

# Produção (via SSH)
ssh usuario@vps_ip
psql -h localhost -p 5432 -U postgressg -d secured_guard_prod
```

### **Verificar Status dos Bancos**

```bash
# Listar bancos
psql -h localhost -p 5432 -U postgressg -l

# Verificar tabelas
psql -h localhost -p 5432 -U postgressg -d secured_guard_dev -c "\dt"

# Verificar migrações do Flyway
psql -h localhost -p 5432 -U postgressg -d secured_guard_dev -c "SELECT * FROM flyway_schema_history;"
```

### **Backup e Restore**

```bash
# Backup
pg_dump -h localhost -p 5432 -U postgressg secured_guard_dev > backup_dev.sql

# Restore
psql -h localhost -p 5432 -U postgressg secured_guard_dev < backup_dev.sql
```

## 🛠️ **Flyway Migrations**

### **Executar Migrações**

```bash
# Via Maven
mvn flyway:migrate -Dflyway.configFiles=src/main/resources/flyway-dev.conf

# Via Docker
docker exec secured-guard-backend-dev java -jar app.jar --spring.profiles.active=dev
```

### **Verificar Status das Migrações**

```bash
# Ver histórico
psql -h localhost -p 5432 -U postgressg -d secured_guard_dev -c "
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
ORDER BY installed_rank;"
```

## 🔐 **Segurança**

### **Boas Práticas**

1. **Nunca commite senhas** no Git
2. **Use senhas fortes** (mínimo 32 caracteres)
3. **Rotacione senhas** regularmente
4. **Monitore conexões** suspeitas
5. **Use SSL** em produção

### **Configuração SSL**

```properties
# application-prod.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/secured_guard_prod?ssl=true&sslmode=require
```

## 🚨 **Solução de Problemas**

### **Erro de Conexão**

```bash
# Verificar se PostgreSQL está rodando
pg_isready -h localhost -p 5432

# Verificar logs
tail -f /var/log/postgresql/postgresql-*.log
```

### **Erro de Permissão**

```sql
-- Conectar como superusuário
sudo -u postgres psql

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE secured_guard_dev TO postgressg;
```

### **Erro de Migração**

```bash
# Verificar status do Flyway
mvn flyway:info

# Reparar migração corrompida
mvn flyway:repair
```

## 📊 **Monitoramento**

### **Métricas de Performance**

```sql
-- Conexões ativas
SELECT count(*) FROM pg_stat_activity;

-- Consultas lentas
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### **Logs de Aplicação**

```bash
# Logs do Spring Boot
docker logs secured-guard-backend-dev

# Logs do PostgreSQL
docker logs secured-guard-db-dev
```

## 🎯 **Checklist de Configuração**

### **Desenvolvimento**
- [ ] PostgreSQL instalado e rodando
- [ ] Bancos de dados criados
- [ ] Usuário `postgressg` criado com permissões
- [ ] Arquivo `.env.dev` configurado
- [ ] DBeaver conectando com sucesso
- [ ] Flyway executando migrações

### **Produção**
- [ ] Senhas de produção geradas
- [ ] Arquivo `.env.prod` configurado
- [ ] SSL habilitado
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] Logs centralizados

## 📞 **Suporte**

Em caso de problemas:

1. **Verificar logs** de aplicação e banco
2. **Consultar documentação** do PostgreSQL
3. **Verificar configurações** de rede e firewall
4. **Testar conectividade** básica
5. **Contatar administrador** do sistema

---

**Última atualização:** $(date)
**Versão:** 1.0
