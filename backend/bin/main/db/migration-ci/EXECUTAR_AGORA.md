# 🚀 Executar Agora - Gerar INSERTs e Atualizar Migration

## Windows PowerShell

```powershell
cd backend/src/main/resources/db/migration-ci

# Configurar credenciais (ajuste se necessário)
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_USER="postgressg"
$env:DB_PASSWORD="sua_senha_aqui"

# Executar script
.\generate_inserts_and_update_migration.ps1
```

## Ou com parâmetros diretos

```powershell
.\generate_inserts_and_update_migration.ps1 -DB_HOST localhost -DB_PORT 5432 -DB_USER postgressg -DB_PASSWORD "sua_senha"
```

## O que acontece

1. ✅ Conecta ao banco `secured_guard_test`
2. ✅ Gera INSERTs de todos os usuários (exceto admin@ci)
3. ✅ Gera INSERTs de todos os user_roles
4. ✅ Gera INSERTs de todos os funcionários
5. ✅ Atualiza automaticamente a migration `V999__seed_ci_essential_data.sql`
6. ✅ Cria backup da migration original

## Pronto!

Depois é só fazer commit e push. No próximo deploy do CI, todos os dados serão copiados automaticamente! 🎉

