# Correção de Migrações do Flyway

## 🔍 Problemas Identificados

O backend estava falhando ao iniciar devido a problemas de ordem e duplicação nas migrações do Flyway:

### Problemas Principais:
1. **V134__ensure_mileage_decimal.sql** - Tentava alterar `vehicle_maintenances.mileage` antes da tabela existir
2. **V221__alter_mileage_to_decimal.sql** - Tentava alterar `vehicle_maintenances.mileage` antes da tabela existir
3. **V226__create_vehicle_maintenances_table.sql** - Criava a tabela (mas só na versão 226!)
4. **V227__create_vehicles_fuel_records_fines_with_uuid.sql** - Dropava `vehicles` mas não `vehicle_maintenances` (quebrava FK)
5. **V229__create_vehicle_maintenances_table.sql** - Duplicata! Tentava criar a mesma tabela novamente
6. **V233__add_photos_documents_to_vehicle_maintenances.sql** - Adicionava colunas que deveriam estar na criação

### Erro Original:
```
ERRO: relação "vehicle_maintenances" não existe
Onde: comando SQL "ALTER TABLE vehicle_maintenances ADD COLUMN mileage DECIMAL(15,9)"
```

## ✅ Correções Aplicadas

### 1. Migrações Removidas (Redundantes/Prematuras):
- ❌ `V134__ensure_mileage_decimal.sql` - Deletada
- ❌ `V221__alter_mileage_to_decimal.sql` - Deletada
- ❌ `V229__create_vehicle_maintenances_table.sql` - Deletada (duplicata)
- ❌ `V233__add_photos_documents_to_vehicle_maintenances.sql` - Deletada (redundante)

### 2. Migrações Atualizadas:

#### V226__create_vehicle_maintenances_table.sql
✅ Agora cria a tabela completa com:
- `mileage DECIMAL(15,9)` (em vez de INTEGER)
- `photos TEXT` (URLs das fotos)
- `documents TEXT` (URLs dos documentos)
- Todos os índices necessários
- Comentários de documentação

#### V227__create_vehicles_fuel_records_fines_with_uuid.sql
✅ Agora dropa `vehicle_maintenances` antes de `vehicles` para evitar erro de FK:
```sql
DROP TABLE IF EXISTS vehicle_maintenances CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS fuel_records CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
```

## 🔄 Como Aplicar as Correções

### Opção 1: Reset Automático (Recomendado para DEV)

Execute o script PowerShell:
```powershell
.\reset_and_restart.ps1
```

Este script irá:
1. Dropar todas as tabelas
2. Limpar o histórico do Flyway (`flyway_schema_history`)
3. Preparar o banco para reexecutar todas as migrações

Depois, basta iniciar o backend normalmente.

### Opção 2: Reset Manual

Execute o SQL diretamente no banco:
```bash
psql -U postgres -h localhost -d secured_guard -f reset_flyway_migrations.sql
```

Depois inicie o backend.

### Opção 3: Apenas Limpar Flyway History (Ambiente de Produção)

⚠️ **CUIDADO:** Só use isso se você sabe o que está fazendo!

```sql
-- Remover apenas as migrações problemáticas do histórico
DELETE FROM flyway_schema_history 
WHERE version IN ('134', '221', '229', '233');

-- Atualizar o checksum da V226 e V227 (se necessário)
DELETE FROM flyway_schema_history 
WHERE version IN ('226', '227');
```

## 📋 Verificação Pós-Correção

Após aplicar as correções e reiniciar o backend, verifique:

1. ✅ Backend inicia sem erros de migração
2. ✅ Tabela `vehicle_maintenances` existe com estrutura correta:
   ```sql
   \d vehicle_maintenances
   ```
3. ✅ Coluna `mileage` é do tipo `DECIMAL(15,9)`
4. ✅ Colunas `photos` e `documents` existem
5. ✅ Todas as migrações foram executadas com sucesso

## 🎯 Resultado Final

### Ordem Correta das Migrações:
1. V226 - Cria `vehicle_maintenances` (com todos os campos corretos)
2. V227 - Recria `vehicles`, `fuel_records` e `fines` (dropando dependências primeiro)
3. (Sem V229, V233, V134, V221 - removidas)

### Estado Final da Tabela `vehicle_maintenances`:
```sql
CREATE TABLE IF NOT EXISTS vehicle_maintenances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    date DATE NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2),
    provider VARCHAR(200),
    mileage DECIMAL(15,9), -- ✅ Já criado como DECIMAL
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    notes TEXT,
    photos TEXT, -- ✅ Já incluído
    documents TEXT, -- ✅ Já incluído
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
```

## 📝 Lições Aprendidas

1. **Ordem de Migrações é Crítica** - Flyway executa em ordem numérica (V1, V2, V134, V221, V226...)
2. **Evitar Duplicatas** - Cada migração deve ter responsabilidade única
3. **CREATE TABLE Completo** - Criar tabelas com todos os campos necessários de uma vez
4. **CASCADE em DROPs** - Sempre considerar foreign keys ao dropar tabelas
5. **IF NOT EXISTS/IF EXISTS** - Usar para tornar migrações idempotentes

## 🔗 Arquivos Criados

- `reset_flyway_migrations.sql` - Script SQL para reset do banco
- `reset_and_restart.ps1` - Script PowerShell automatizado
- `MIGRATION_FIXES_SUMMARY.md` - Este documento

---

**Data da Correção:** 07/10/2025
**Correções Aplicadas:** 4 migrações deletadas, 2 atualizadas
**Status:** ✅ Pronto para uso

