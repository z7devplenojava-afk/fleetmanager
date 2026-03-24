# 📋 Como a Migration Copia Dados do secured_guard_test para CI

## 🎯 Objetivo

A migration `V999__seed_ci_essential_data.sql` **automaticamente copia** todos os usuários e funcionários do banco `secured_guard_test` para o banco `secured_guard_ci` quando o Flyway executa no deploy.

## 🔄 Como Funciona

### Estratégia Dupla (dblink + fallback)

A migration usa uma **estratégia dupla** para garantir que os dados sejam copiados:

1. **Tentativa 1: dblink (automático)**
   - A migration `V998__enable_dblink_extension.sql` tenta habilitar a extensão `dblink`
   - Se disponível, a `V999` copia os dados **automaticamente** via `dblink`
   - ✅ **Vantagem**: Totalmente automático, sem necessidade de gerar INSERTs manualmente

2. **Fallback: INSERTs hardcoded**
   - Se `dblink` não estiver disponível ou falhar, a migration usa INSERTs hardcoded
   - Estes INSERTs são gerados executando o script `generate_hardcoded_inserts.sh`
   - ✅ **Vantagem**: Funciona mesmo sem permissões para criar extensões

## 🚀 Fluxo de Execução

```
1. Deploy no VPS (docker-compose up)
   ↓
2. Backend CI inicia com perfil "ci"
   ↓
3. Flyway executa migrations na ordem:
   - V998: Tenta habilitar dblink
   - V999: Tenta copiar dados via dblink
      ├─ Se dblink funcionar → Copia automaticamente ✅
      └─ Se dblink falhar → Usa INSERTs hardcoded ✅
   ↓
4. ✅ Banco CI populado com dados do secured_guard_test
```

## 📝 Opções de Uso

### Opção A: Usar dblink (Recomendado - Automático)

**Pré-requisitos:**
- PostgreSQL com permissões para criar extensões
- Banco `secured_guard_test` acessível do banco `secured_guard_ci`

**O que fazer:**
1. ✅ Nada! A migration já tenta usar dblink automaticamente
2. Se funcionar, os dados são copiados automaticamente a cada deploy

**Verificar se funcionou:**
```sql
-- No banco CI, verificar se dados foram copiados
SELECT COUNT(*) FROM users WHERE username != 'admin@ci';
SELECT COUNT(*) FROM employees;
```

### Opção B: Gerar INSERTs Hardcoded (Fallback)

**Quando usar:**
- Se dblink não estiver disponível
- Se não tiver permissões para criar extensões
- Se quiser garantir que os dados estejam na migration mesmo sem acesso ao banco de teste

**Como fazer:**

1. **No servidor Linux/VPS:**
   ```bash
   cd /caminho/para/o/projeto
   
   # Configurar credenciais (ajuste se necessário)
   export DB_USER=postgressg
   export DB_PASSWORD=sua_senha
   export DB_HOST=localhost
   export DB_PORT=5432
   
   # Executar script
   bash backend/src/main/resources/db/migration-ci/generate_hardcoded_inserts.sh
   ```

2. **O script irá:**
   - ✅ Conectar ao banco `secured_guard_test`
   - ✅ Exportar todos os usuários e funcionários
   - ✅ Atualizar automaticamente a migration `V999` com os INSERTs
   - ✅ Criar backup da migration original

3. **Fazer commit e push:**
   ```bash
   git add backend/src/main/resources/db/migration-ci/V999__seed_ci_essential_data.sql
   git commit -m "Atualizar seed CI com dados do banco de teste"
   git push
   ```

4. **No próximo deploy:**
   - A migration executará os INSERTs hardcoded
   - Os dados serão copiados mesmo sem dblink

## 🔧 Configuração de Credenciais

A migration V999 usa estas credenciais padrão para conectar ao `secured_guard_test`:

```sql
test_db_user TEXT := 'postgressg';
test_db_password TEXT := '4KaCiJc6an@7sgbdcid2025';
```

**Para alterar:**
- Edite a migration `V999__seed_ci_essential_data.sql`
- Procure pelas variáveis `test_db_user` e `test_db_password`
- Ajuste conforme necessário

## ⚠️ Importante

1. **ON CONFLICT DO NOTHING**: Todos os INSERTs usam `ON CONFLICT (id) DO NOTHING`, então é seguro executar múltiplas vezes

2. **Exclusão do admin@ci**: O usuário `admin@ci` é automaticamente excluído da cópia (já existe na migration)

3. **Ordem de execução**: 
   - Primeiro: Dados essenciais (admin@ci, unidades, turnos, etc.)
   - Depois: Usuários e funcionários do banco de teste

4. **Atualização dos dados**: 
   - Se usar dblink: Os dados são sempre atualizados do banco de teste a cada deploy
   - Se usar INSERTs hardcoded: Precisa reexecutar o script `generate_hardcoded_inserts.sh` quando houver mudanças

## 🐛 Troubleshooting

### Erro: "extension dblink does not exist"
- **Solução**: A migration usará automaticamente os INSERTs hardcoded como fallback
- Se quiser habilitar dblink, execute no banco CI:
  ```sql
  CREATE EXTENSION IF NOT EXISTS dblink;
  ```

### Erro: "permission denied to create extension"
- **Solução**: A migration usará automaticamente os INSERTs hardcoded como fallback
- Ou conceda permissões ao usuário do banco:
  ```sql
  GRANT CREATE ON DATABASE secured_guard_ci TO postgressg;
  ```

### Nenhum dado copiado
- **Verificar logs do backend:**
  ```bash
  docker logs secured-guard-backend-ci | grep -i "copiando\|dblink\|fallback"
  ```
- **Verificar se o banco de teste está acessível:**
  ```sql
  -- No banco CI
  SELECT dblink_connect('test', 'host=localhost port=5432 dbname=secured_guard_test user=postgressg password=senha');
  ```

### Dados duplicados
- Isso não deveria acontecer devido ao `ON CONFLICT DO NOTHING`
- Se acontecer, verifique se há problemas com constraints ou índices únicos

## 📊 Verificar Dados Copiados

```sql
-- Verificar usuários copiados
SELECT COUNT(*) as total_usuarios FROM users WHERE username != 'admin@ci';

-- Verificar funcionários copiados
SELECT COUNT(*) as total_funcionarios FROM employees;

-- Verificar user_roles copiados
SELECT COUNT(*) as total_user_roles FROM user_roles ur
JOIN users u ON ur.user_id = u.id
WHERE u.username != 'admin@ci';
```

## 🎯 Resumo

- ✅ **Automático com dblink**: Se a extensão estiver disponível, tudo funciona automaticamente
- ✅ **Fallback com INSERTs**: Se dblink não funcionar, use o script `generate_hardcoded_inserts.sh`
- ✅ **Idempotente**: Pode executar múltiplas vezes sem problemas
- ✅ **Seguro**: Usa `ON CONFLICT DO NOTHING` para evitar duplicatas

