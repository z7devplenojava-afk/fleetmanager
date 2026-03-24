# 🌱 Seed de Banco de Dados - Deploy Automático CI

## 📋 Visão Geral

O seed de banco de dados é executado **automaticamente** durante o deploy do ambiente CI. Ele popula o banco com dados essenciais para testes e desenvolvimento.

## 🔄 Como Funciona

### 1. **Migration Flyway (Dados Essenciais)**

**Arquivo:** `backend/src/main/resources/db/migration/V999__seed_ci_essential_data.sql`

- ✅ Executado **automaticamente** pelo Flyway quando o backend inicia
- ✅ Flyway está habilitado no perfil `ci` (`application-ci.properties`)
- ✅ Executa **apenas uma vez** (usa `ON CONFLICT DO NOTHING`)

**Dados criados:**
- 👤 Usuário administrador: `admin@ci` (senha: `Admin123!`)
- 🏢 Unidade Matriz CI
- ⏰ Turnos: Manhã, Tarde, Noite
- 💼 Cargos: Vigilante, Supervisor, Gerente
- 🏛️ Departamento: Operacional
- 👥 Cliente de teste: Cliente Teste CI

### 2. **CIDataLoader (Dados Adicionais)**

**Arquivo:** `backend/src/main/java/com/z7design/secured_guard/config/CIDataLoader.java`

- ✅ Executado **automaticamente** quando o backend inicia com perfil `ci`
- ✅ Usa `CommandLineRunner` com `@Profile("ci")`
- ✅ Verifica se já existem dados antes de criar (evita duplicação)

**Dados criados:**
- 🦺 5 EPIs (Equipamentos de Proteção Individual):
  - Capacete de Segurança
  - Luvas de Proteção
  - Óculos de Proteção
  - Calçado de Segurança
  - Uniforme de Trabalho

## 🚀 Fluxo de Execução no Deploy

```
1. GitHub Actions executa workflow
   ↓
2. Build e push das imagens Docker
   ↓
3. Deploy no VPS (docker-compose up)
   ↓
4. Backend inicia com perfil "ci"
   ↓
5. Flyway executa migrations (incluindo V999__seed_ci_essential_data.sql)
   ↓
6. CIDataLoader executa e popula EPIs
   ↓
7. ✅ Banco de dados populado e pronto para uso!
```

## 📝 Credenciais de Acesso

### Usuário Administrador

- **Username:** `admin@ci`
- **Senha:** `Admin123!`
- **Email:** `admin@ci.z7botsolutions.com.br`
- **Role:** `ADMIN`

## 🔍 Verificar se Seed Foi Executado

### Via Logs do Backend

```bash
# No VPS
docker logs secured-guard-backend-ci | grep -i "seed\|flyway\|CIDataLoader"
```

**Logs esperados:**
```
✅ Seed de dados essenciais para CI concluído com sucesso!
✅ Já existem X EPIs no banco de dados. Pulando inicialização.
```

### Via Banco de Dados

```sql
-- Verificar usuário admin
SELECT id, username, email, role FROM users WHERE username = 'admin@ci';

-- Verificar unidades
SELECT id, name FROM units WHERE name LIKE '%CI%';

-- Verificar EPIs
SELECT COUNT(*) as total_epis FROM personal_protective_equipment;

-- Verificar turnos
SELECT id, name FROM shifts;
```

## 🔧 Manutenção

### Adicionar Novos Dados ao Seed

1. **Dados essenciais (sempre executados):**
   - Edite `V999__seed_ci_essential_data.sql`
   - Use `ON CONFLICT DO NOTHING` para evitar duplicação

2. **Dados adicionais (condicionais):**
   - Edite `CIDataLoader.java`
   - Adicione verificações para evitar duplicação

### Resetar Seed (Reexecutar)

```bash
# No VPS
cd /var/www/secured_guard/ci

# Parar backend
docker-compose -f docker-compose.ci.yml stop backend-ci

# Remover dados específicos (cuidado!)
docker exec -it secured-guard-db-ci psql -U postgressg -d secured_guard_ci -c "DELETE FROM users WHERE username = 'admin@ci';"

# Reiniciar backend (seed será executado novamente)
docker-compose -f docker-compose.ci.yml start backend-ci
```

## ⚠️ Importante

- ✅ O seed **não** sobrescreve dados existentes (usa `ON CONFLICT DO NOTHING`)
- ✅ O seed **não** remove dados existentes
- ✅ O seed é **idempotente** (pode ser executado múltiplas vezes sem problemas)
- ✅ O seed **só executa no ambiente CI** (perfil `ci`)

## 📊 Estrutura de Dados Criados

```
users (1)
  └── admin@ci

units (1)
  └── Unidade Matriz CI

positions (3)
  ├── Vigilante
  ├── Supervisor
  └── Gerente

shifts (3)
  ├── Manhã
  ├── Tarde
  └── Noite

departments (1)
  └── Operacional

clients (1)
  └── Cliente Teste CI

personal_protective_equipment (5)
  ├── Capacete de Segurança
  ├── Luvas de Proteção
  ├── Óculos de Proteção
  ├── Calçado de Segurança
  └── Uniforme de Trabalho
```

## 🎯 Próximos Passos

Após o deploy, você pode:

1. ✅ Fazer login com `admin@ci` / `Admin123!`
2. ✅ Criar funcionários, clientes, etc.
3. ✅ Testar funcionalidades do sistema
4. ✅ Usar os dados de seed como base para testes

---

**Última atualização:** Criado junto com sistema de deploy automático CI
