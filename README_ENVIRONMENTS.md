# 🚀 Secured Guard - Guia Completo de Ambientes

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Ambiente LOCAL](#ambiente-local)
3. [Ambientes Remotos](#ambientes-remotos)
4. [Backup e Restore](#backup-e-restore)
5. [Seeds do Banco](#seeds-do-banco)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### **Arquitetura de Ambientes**

```
secured-guard-local-*    → Desenvolvimento no seu computador
secured-guard-ci-*       → Pipeline CI/CD (GitHub Actions)
secured-guard-dev-*      → Desenvolvimento remoto
secured-guard-test-*     → Testes/QA
secured-guard-prod-*     → Produção
```

### **Portas por Ambiente**

| Ambiente | PostgreSQL | Backend | Frontend | Redis | WhatsApp |
|----------|-----------|---------|----------|-------|----------|
| **LOCAL** | 5432 | 8083 | 3000 | 6379 | 3333 |
| **CI** | 5434 | 8085 | 3002 | 6381 | 3335 |
| **DEV** | 5432 | 8083 | 3000 | 6379 | 3333 |
| **TEST** | 5433 | 8084 | 3001 | 6380 | 3334 |
| **PROD** | 5435 | 8086 | 3003 | 6382 | 3336 |

---

## 🏠 Ambiente LOCAL

### **Início Rápido** (3 passos)

```powershell
# 1. Clonar repositório
git clone https://github.com/your-org/secured-guard.git
cd secured-guard

# 2. Iniciar ambiente (Windows)
.\scripts\start-local.ps1

# OU (Linux/Mac)
chmod +x scripts/start-local.sh
./scripts/start-local.sh

# 3. Acessar sistema
# Frontend: http://localhost:3000
# Backend: http://localhost:8083
```

### **O que está incluído?**

✅ **PostgreSQL** - Banco com dados de desenvolvimento  
✅ **Redis** - Cache  
✅ **MinIO** - Armazenamento S3  
✅ **WhatsApp** - Serviço Baileys  
✅ **Backend** - Spring Boot com hot reload  
✅ **Frontend** - React com hot reload  

### **Hot Reload**

- **Backend:** Altere arquivos em `backend/src` → Maven recompila automaticamente
- **Frontend:** Altere arquivos em `frontend/src` → Vite atualiza instantaneamente

### **Debug Remoto**

```
Host: localhost
Port: 5005
```

Configure sua IDE para conectar na porta 5005.

---

## 🌐 Ambientes Remotos

### **DEV - Desenvolvimento Remoto**

```bash
docker-compose -f docker-compose.dev.yml up -d
```

- URL: https://dev.z7botsolutions.com.br
- Deploy automático via GitHub Actions (branch `develop`)

### **TEST - Testes/QA**

```bash
docker-compose -f docker-compose.test.yml up -d
```

- URL: https://test.z7botsolutions.com.br
- Deploy manual com aprovação
- Dados de teste (mock)

### **PROD - Produção**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

- URL: https://secured-guard.com.br
- Deploy manual com **dupla aprovação**
- **Backup automático** antes de cada deploy
- Logs limitados (10MB, 3 arquivos)

---

## 💾 Backup e Restore

### **Fazer Backup via DBeaver**

1. Conectar ao banco (ex: local)
2. Botão direito no banco → **Tools** → **Backup Database**
3. **Format:** Custom (Compressed)
4. **Incluir:** Data + Schema + Owners
5. Salvar como: `backup-2025-12-03.backup`

### **Restaurar em outro ambiente**

1. Conectar ao banco destino
2. **Criar banco vazio** se necessário
3. Botão direito → **Tools** → **Restore Database**
4. Selecionar arquivo `.backup`
5. Aguardar conclusão ✅

### **Scripts Automatizados** (Recomendado)

```bash
# Criar estrutura de seeds (uma vez)
mkdir -p seeds/{schema,common,local,test,prod}

# Exportar do LOCAL para seeds
pg_dump -h localhost -U dev_user -d secured_guard_local \
  --schema-only > seeds/schema/01-schema.sql

pg_dump -h localhost -U dev_user -d secured_guard_local \
  --data-only --table=users --table=roles \
  > seeds/common/10-users-roles.sql

# Popular ambiente TEST com os seeds
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
```

---

## 🌱 Seeds do Banco

### **Estrutura de Seeds**

```
seeds/
├── schema/              # Estrutura do banco (CREATE TABLE)
│   └── 01-schema.sql
├── common/              # Dados para TODOS os ambientes
│   ├── 10-roles.sql     # Roles e permissões
│   └── 11-admin.sql     # Usuário admin
├── local/               # Dados de desenvolvimento
│   ├── 20-employees.sql # 50+ funcionários fake
│   └── 21-clients.sql   # 20+ clientes fake
├── test/                # Dados de teste
│   └── 20-test-data.sql
└── prod/                # Dados iniciais de produção
    └── 20-initial.sql   # Apenas dados críticos
```

### **Como Criar Seeds**

#### **Exportar Schema**

```bash
docker exec secured-guard-local-db pg_dump \
  -U dev_user \
  -d secured_guard_local \
  --schema-only \
  > seeds/schema/01-schema.sql
```

#### **Exportar Dados Essenciais**

```bash
docker exec secured-guard-local-db pg_dump \
  -U dev_user \
  -d secured_guard_local \
  --data-only \
  --column-inserts \
  --table=users --table=roles --table=permissions \
  > seeds/common/10-essential.sql
```

#### **Exportar Dados de Desenvolvimento**

```bash
docker exec secured-guard-local-db pg_dump \
  -U dev_user \
  -d secured_guard_local \
  --data-only \
  --column-inserts \
  --table=employees --table=clients --table=vehicles \
  > seeds/local/20-mock-data.sql
```

---

## 🔍 Troubleshooting

### **Container não inicia**

```bash
# Ver logs
docker-compose -f docker-compose.local.yml logs -f [service]

# Reconstruir
docker-compose -f docker-compose.local.yml build --no-cache

# Remover e recriar
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d
```

### **Backend não conecta ao banco**

```bash
# Verificar se PostgreSQL está pronto
docker-compose -f docker-compose.local.yml exec postgres pg_isready -U dev_user

# Ver logs do backend
docker-compose -f docker-compose.local.yml logs -f backend
```

### **WhatsApp: Erro 401**

```bash
# Limpar sessão
docker exec secured-guard-local-whatsapp rm -rf /app/sessions/*
docker restart secured-guard-local-whatsapp

# Aguardar 10s e gerar novo QR Code
```

### **Hot Reload não funciona (Windows)**

Se estiver usando WSL2, os arquivos devem estar **dentro do WSL**, não em `/mnt/c/`.

```bash
# Mover projeto para WSL (recomendado)
cd ~
git clone https://github.com/your-org/secured-guard.git
cd secured-guard
./scripts/start-local.sh
```

### **Limpar tudo e recomeçar**

```bash
# Parar e remover tudo
docker-compose -f docker-compose.local.yml down -v

# Limpar imagens antigas
docker image prune -a

# Reconstruir do zero
docker-compose -f docker-compose.local.yml build --no-cache
docker-compose -f docker-compose.local.yml up -d
```

---

## 📊 Comandos Úteis

### **Docker Compose**

```bash
# Iniciar
docker-compose -f docker-compose.local.yml up -d

# Parar
docker-compose -f docker-compose.local.yml down

# Ver logs
docker-compose -f docker-compose.local.yml logs -f

# Status
docker-compose -f docker-compose.local.yml ps

# Reiniciar serviço
docker-compose -f docker-compose.local.yml restart backend

# Executar comando em container
docker-compose -f docker-compose.local.yml exec backend bash
```

### **Database**

```bash
# Conectar ao PostgreSQL
docker exec -it secured-guard-local-db psql -U dev_user -d secured_guard_local

# Backup
docker exec secured-guard-local-db pg_dump -U dev_user secured_guard_local > backup.sql

# Restore
cat backup.sql | docker exec -i secured-guard-local-db psql -U dev_user -d secured_guard_local
```

### **Redis**

```bash
# Conectar ao Redis
docker exec -it secured-guard-local-redis redis-cli

# Ver chaves
docker exec secured-guard-local-redis redis-cli KEYS '*'

# Limpar cache
docker exec secured-guard-local-redis redis-cli FLUSHALL
```

---

## 🎯 Próximos Passos

1. ✅ Ambiente local funcionando
2. 📱 Conectar WhatsApp (Configurações > Conexão WhatsApp)
3. 👤 Fazer login (usuário admin criado pelos seeds)
4. 🧪 Testar funcionalidades
5. 🚀 Fazer deploy para DEV quando pronto

---

## 📚 Documentação Adicional

- **Docker Compose:** `DOCKER_COMPOSE_GUIDE.md`
- **Deploy CI/CD:** `.github/workflows/deploy-pipeline.yml`
- **Backup/Restore:** Ver seção acima

---

**Última atualização:** 03/12/2025  
**Versão:** 1.0.0





























