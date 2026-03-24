# Comandos para executar migrações na VPS por ambiente

## 🚀 Opção 1: Comando Direto por Ambiente
```bash
# PRODUÇÃO
cd /caminho/para/secured-guard/backend
mvn flyway:migrate -Dspring.profiles.active=vps-prod

# DESENVOLVIMENTO
mvn flyway:migrate -Dspring.profiles.active=vps-dev

# CI/CD
mvn flyway:migrate -Dspring.profiles.active=vps-ci
```

## 🚀 Opção 2: Via Script por Ambiente
```bash
# Copiar o script para a VPS
scp run_migrations_vps_env.sh usuario@ip-da-vps:/caminho/para/secured-guard/

# Conectar e executar
ssh usuario@ip-da-vps
cd /caminho/para/secured-guard
chmod +x run_migrations_vps_env.sh

# Executar para cada ambiente
./run_migrations_vps_env.sh prod
./run_migrations_vps_env.sh dev
./run_migrations_vps_env.sh ci
```

## 🚀 Opção 3: Via Docker por Ambiente
```bash
# PRODUÇÃO
docker-compose exec backend mvn flyway:migrate -Dspring.profiles.active=vps-prod

# DESENVOLVIMENTO
docker-compose exec backend mvn flyway:migrate -Dspring.profiles.active=vps-dev

# CI/CD
docker-compose exec backend mvn flyway:migrate -Dspring.profiles.active=vps-ci
```

## 🚀 Opção 4: Comando Completo por Ambiente
```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Navegar para o projeto
cd /caminho/para/secured-guard/backend

# PRODUÇÃO
echo "=== PRODUÇÃO ==="
mvn flyway:info -Dspring.profiles.active=vps-prod
mvn flyway:migrate -Dspring.profiles.active=vps-prod
mvn flyway:info -Dspring.profiles.active=vps-prod
psql -h localhost -p 5432 -U postgressg -d secured_guard_prod -c "\dt"

# DESENVOLVIMENTO
echo "=== DESENVOLVIMENTO ==="
mvn flyway:info -Dspring.profiles.active=vps-dev
mvn flyway:migrate -Dspring.profiles.active=vps-dev
mvn flyway:info -Dspring.profiles.active=vps-dev
psql -h localhost -p 5432 -U postgressg -d secured_guard_dev -c "\dt"

# CI/CD
echo "=== CI/CD ==="
mvn flyway:info -Dspring.profiles.active=vps-ci
mvn flyway:migrate -Dspring.profiles.active=vps-ci
mvn flyway:info -Dspring.profiles.active=vps-ci
psql -h localhost -p 5432 -U postgressg -d secured_guard_ci -c "\dt"
```

## 📋 Configurações Importantes

### Banco de Dados por Ambiente:
- **Host:** localhost
- **Porta:** 5432
- **Usuário:** postgressg
- **Senha:** ${POSTGRES_PASSWORD} (variável de ambiente)

| Ambiente | Banco | Perfil |
|----------|-------|--------|
| **PRODUÇÃO** | `secured_guard_prod` | `vps-prod` |
| **DESENVOLVIMENTO** | `secured_guard_dev` | `vps-dev` |
| **CI/CD** | `secured_guard_ci` | `vps-ci` |

### Migrações Pendentes:
- 273: create equipments table
- 274: create equipment movements table
- 275: insert test employees and equipment assignments
- 276: insert missing test data
- 277: fix positions table
- 278: make unit id optional in positions
- 280: create chat messages table
- 281: add missing columns to messages
- 282: add missing columns to job candidates
- 283: add cnh fields to job vacancies
- 284: add cost center to invoices
- 285: add fields to financial transactions
- 286: create products table
- 287: create purchase requests table
- 288: create purchase request items table
- 289: create inventories table
- 300: add product variations
- 301: create companies table
- 302: create payment receipts table
- 303: create unified documents table
- 304: create cost centers table
- 305: create work schedules table
- 306: create operational occurrences table
- 307: create system notifications table
- 308: add bank fields to payment receipts
- 309: create user activity logs table
- 310: add created at to user activity logs
- 311: add missing columns to user activity logs
- 312: fix jose ramos super admin
- 313: create file system items table
- 400: insert operational test data
- 401: create vehicle maintenances table
- 402: add photos documents to vehicle maintenances
- 403: add missing vehicle fields
- 404: create scheduled payments table
- 405: add missing vehicle fields
- 406: fix orphaned fuel records
- 407: create fuel stations table
- 409: fix work post types
- 410: add responsible employee to vehicles
- 411: add photos to vehicles
- 412: add mileage fields to fuel records
- 413: cleanup km controls table
- 414: create company configs table
- 416: add missing fields to registros ponto
- 418: create measurement tables
- 419: create stock tables
- 420: create visits table
- 421: create visit schedules table
- 422: enhance visits and units for route optimization
- 423: add dashboard photo fields to km controls
- 500: create facial embeddings table
- 501: add driver to fines
- 502: create document models tables
- 503: create sst tables
- 504: add cnh number to employees
- 999: insert test user
- 1002: fix schema version
- 1003: create activity reports tables
- 1004: rename medical consultation date column
- 1005: rename activity report number columns
- 1006: rename activity report valid until columns
- 1007: add missing columns to measurement items
- 1008: fix cost center id type
- 1009: add fuel quantity to km controls
- 1010: create shift change forms table
- 1011: create rotas table
- 1012: create postos table
- 1013: create rota postos table
- 1015: fix payslips month type
- 1016: fix km controls total km constraint
- 1017: test km controls constraint
- 1018: add processed at to payment receipts
- 1019: create accounts receivable table

## ⚠️ Observações:
1. **Backup:** Faça backup do banco antes de executar as migrações
2. **Teste:** Execute primeiro em ambiente de teste
3. **Monitoramento:** Monitore os logs durante a execução
4. **Rollback:** Tenha um plano de rollback caso algo dê errado
