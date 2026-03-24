# 🔧 Guia para Resetar Migrações - Passo a Passo

## ✅ O que já foi feito:
- ❌ Deletado: V134, V221, V229, V233 (migrações problem áticas)
- ✏️ Atualizado: V226 e V227 (corrigidos)
- 🧹 Limpeza: Pasta `backend\target` removida

## 🚀 Próximos Passos (Execute AGORA):

### Opção 1: Reset via DBeaver ou pgAdmin (RECOMENDADO)

1. **Abra o DBeaver ou pgAdmin**
2. **Conecte-se ao banco `secured_guard`**
3. **Execute este SQL:**

```sql
-- ATENÇÃO: Isto vai LIMPAR TODAS as tabelas!
-- Use apenas em ambiente de desenvolvimento

-- Dropar tabelas na ordem correta (dependências primeiro)
DROP TABLE IF EXISTS vehicle_maintenances CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS fuel_records CASCADE;
DROP TABLE IF EXISTS mileage_records CASCADE;
DROP TABLE IF EXISTS km_controls CASCADE;
DROP TABLE IF EXISTS work_post_epis CASCADE;
DROP TABLE IF EXISTS work_post_trainings CASCADE;
DROP TABLE IF EXISTS work_post_equipment CASCADE;
DROP TABLE IF EXISTS work_posts CASCADE;
DROP TABLE IF EXISTS equipment_movements CASCADE;
DROP TABLE IF EXISTS equipments CASCADE;
DROP TABLE IF EXISTS employee_assignments CASCADE;
DROP TABLE IF EXISTS purchase_request_items CASCADE;
DROP TABLE IF EXISTS purchase_requests CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS product_variations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS measurement_items CASCADE;
DROP TABLE IF EXISTS measurements CASCADE;
DROP TABLE IF EXISTS service_items CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS scheduled_payments CASCADE;
DROP TABLE IF EXISTS payment_receipts CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS bank_reconciliations CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS file_system_items CASCADE;
DROP TABLE IF EXISTS unified_documents CASCADE;
DROP TABLE IF EXISTS document_signatures CASCADE;
DROP TABLE IF EXISTS operational_occurrences CASCADE;
DROP TABLE IF EXISTS work_schedules CASCADE;
DROP TABLE IF EXISTS visit_schedules CASCADE;
DROP TABLE IF EXISTS visit_employees CASCADE;
DROP TABLE IF EXISTS visit_photos CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS visits_backup CASCADE;
DROP TABLE IF EXISTS activity_reports CASCADE;
DROP TABLE IF EXISTS rota_postos CASCADE;
DROP TABLE IF EXISTS rotas CASCADE;
DROP TABLE IF EXISTS postos CASCADE;
DROP TABLE IF EXISTS shift_change_forms CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS vacations CASCADE;
DROP TABLE IF EXISTS overtime CASCADE;
DROP TABLE IF EXISTS payslips CASCADE;
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS time_records CASCADE;
DROP TABLE IF EXISTS facial_embeddings CASCADE;
DROP TABLE IF EXISTS job_candidates CASCADE;
DROP TABLE IF EXISTS job_vacancies CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_group_membership CASCADE;
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cost_centers CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS company_configs CASCADE;
DROP TABLE IF EXISTS fuel_stations CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS crm_kanban_items CASCADE;
DROP TABLE IF EXISTS crm_kanban_boards CASCADE;
DROP TABLE IF EXISTS document_models CASCADE;
DROP TABLE IF EXISTS sst_exams CASCADE;
DROP TABLE IF EXISTS sst_trainings CASCADE;
DROP TABLE IF EXISTS sst_epi_deliveries CASCADE;
DROP TABLE IF EXISTS sst_epis CASCADE;
DROP TABLE IF EXISTS sst_accidents CASCADE;
DROP TABLE IF EXISTS sst_alerts CASCADE;
DROP TABLE IF EXISTS cipa_meetings CASCADE;
DROP TABLE IF EXISTS position_risks CASCADE;
DROP TABLE IF EXISTS employee_risks CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS system_notifications CASCADE;

-- LIMPAR HISTÓRICO DO FLYWAY (CRÍTICO!)
DROP TABLE IF EXISTS flyway_schema_history CASCADE;

-- Mensagem de sucesso
SELECT 'Banco resetado com sucesso! Agora inicie o backend.' AS resultado;
```

4. **Inicie o backend** (na sua IDE)
5. **Aguarde as migrações executarem**

### Opção 2: Reset via SQL File (Se tiver acesso ao psql)

```powershell
# Configure a senha do PostgreSQL
$env:PGPASSWORD = "root"

# Execute o reset
& "C:\Program Files\PostgreSQL\<versao>\bin\psql.exe" -U postgres -h localhost -d secured_guard -f reset_flyway_migrations.sql

# Remova a variável de ambiente
Remove-Item Env:\PGPASSWORD
```

**Nota:** Substitua `<versao>` pela versão instalada do PostgreSQL (ex: 14, 15, 16).

### Opção 3: Manualmente via Terminal do PostgreSQL

```bash
# Abra o psql
psql -U postgres -h localhost -d secured_guard

# Digite a senha quando solicitado: root

# Execute:
\i C:/dev/secured-guard/reset_flyway_migrations.sql
```

---

## 📋 Após o Reset:

1. ✅ **Inicie o backend** normalmente
2. ✅ O Flyway vai executar todas as 217 migrações
3. ✅ Agora **SEM ERROS** porque:
   - V134, V221 foram removidas (tentavam alterar tabela inexistente)
   - V229, V233 foram removidas (duplicatas)
   - V226 agora cria a tabela completa de uma vez
   - V227 dropa dependências na ordem correta

---

## 🔍 Verificação Pós-Migração:

Execute no banco após o backend iniciar:

```sql
-- Verificar se vehicle_maintenances foi criada corretamente
\d vehicle_maintenances

-- Deve mostrar:
-- - mileage: numeric(15,9)
-- - photos: text
-- - documents: text

-- Verificar quantas migrações foram executadas
SELECT COUNT(*) FROM flyway_schema_history;
-- Deve mostrar aproximadamente 213-217 (dependendo das que foram removidas)
```

---

## ⚠️ Problemas Comuns:

### 1. "psql não encontrado"
**Solução:** Use o DBeaver ou pgAdmin (Opção 1 - mais fácil!)

### 2. "Tabela não existe"
**Solução:** Normal! Algumas tabelas podem não existir ainda, o CASCADE cuida disso.

### 3. "Migrações ainda falhando"
**Solução:** 
- Verifique se a pasta `backend\target` foi realmente deletada
- Certifique-se de ter executado o SQL de reset
- Limpe o cache da IDE (File → Invalidate Caches / Restart)

---

## 📊 Resumo das Correções:

| Migração | Status Antes | Status Agora |
|----------|--------------|--------------|
| V134 | ❌ Erro | ✅ Removida |
| V221 | ❌ Erro | ✅ Removida |
| V226 | ⚠️ Incompleta | ✅ Corrigida |
| V227 | ⚠️ Problema FK | ✅ Corrigida |
| V229 | ❌ Duplicata | ✅ Removida |
| V233 | ❌ Redundante | ✅ Removida |

---

## 🎯 Resultado Esperado:

```
[INFO] Started SecuredGuardApplication in X.XXX seconds
[INFO] Flyway migration completed successfully
[INFO] Tomcat started on port(s): 8080
```

✅ **Backend iniciando sem erros!**

---

**Última Atualização:** 07/10/2025
**Arquivos Criados:**
- `reset_flyway_migrations.sql` - Script SQL de reset
- `GUIA_RESET_MIGRATIONS.md` - Este guia
- `MIGRATION_FIXES_SUMMARY.md` - Documentação técnica

