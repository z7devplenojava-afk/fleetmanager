# 🔄 INSTRUÇÕES PARA DELETAR E RECRIAR O BANCO

## ✅ Esta é a Solução Mais Limpa!

Deletar e recriar o banco resolve TODOS os problemas de uma vez:
- ✅ Remove todas as tabelas
- ✅ Remove todo o histórico do Flyway
- ✅ Permite que TODAS as migrations sejam executadas do zero
- ✅ Garante que a estrutura fique 100% correta

## 📋 Passo a Passo

### PASSO 1: Conectar ao Banco `postgres` no DBeaver

⚠️ **IMPORTANTE**: Conecte ao banco **postgres**, NÃO ao `secured_guard`!

1. Abra o DBeaver
2. Clique na conexão do PostgreSQL
3. **Selecione o banco `postgres`** (não o `secured_guard`)
4. Abra um novo SQL Editor

### PASSO 2: Executar o Script

Copie e execute o conteúdo do arquivo `DELETAR_E_RECRIAR_BANCO.sql`:

```sql
-- 1. Desconectar todas as conexões ativas
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'secured_guard'
  AND pid <> pg_backend_pid();

-- 2. Deletar o banco
DROP DATABASE IF EXISTS secured_guard;

-- 3. Recriar o banco
CREATE DATABASE secured_guard
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;
```

### PASSO 3: Conectar ao Banco `secured_guard` e Habilitar UUID

Agora conecte ao banco `secured_guard` e execute:

```sql
-- Habilitar extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### PASSO 4: Reiniciar o Backend

Pare o backend (Ctrl+C) e reinicie:

```powershell
java -jar backend/target/secured-guard-1.0.0.jar --spring.profiles.active=test
```

## 🎯 O Que Vai Acontecer

O Flyway vai executar **TODAS** as migrations na ordem correta:

1. ✅ **V1**: Cria tabela `users`
2. ✅ **V2**: Cria tabelas `units`, `positions` (com `base_salary`), `employees` (COMPLETA com todas as colunas + `company_id`), etc.
3. ✅ **V3 a V126**: Cria outras tabelas e adiciona colunas
4. ✅ **V127**: Cria tabela `companies` e adiciona foreign key em `employees.company_id`
5. ✅ **V128 a V262**: Outras migrations (que agora não causarão erros porque usam `IF NOT EXISTS`)
6. ✅ **V259**: Cria tabela `dependents`

## 🎉 Resultado Final

- ✅ Banco de dados limpo e consistente
- ✅ Tabela `employees` completa com todas as colunas
- ✅ Relacionamento `company_id` funcionando
- ✅ Todas as migrations executadas na ordem correta
- ✅ Backend iniciará sem erros
- ✅ **Cadastro de funcionários funcionando perfeitamente!**

## ⏱️ Tempo Estimado

- Executar scripts: 30 segundos
- Backend iniciar e executar migrations: 1-2 minutos
- **Total: ~3 minutos** e tudo estará funcionando! 🚀

## 📝 Observação

Se você tiver dados importantes no banco, **NÃO execute este script**. Nesse caso, volte para a solução anterior de limpar apenas as migrations problemáticas.

Mas se for ambiente de desenvolvimento/teste, **esta é a melhor opção**! 💪

