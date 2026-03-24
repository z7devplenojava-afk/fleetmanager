# 🚀 Guia de Deploy em Ambiente CI

## 📋 Resumo
Este guia descreve como fazer o deploy do sistema Secured Guard em ambiente CI (Continuous Integration) usando Docker Compose.

## ⚙️ Pré-requisitos

### 1. **Docker Desktop**
- ✅ Docker versão: **28.4.0** (instalado)
- ⚠️ **Docker Desktop precisa estar rodando**

**Como iniciar o Docker Desktop:**
1. Abra o **Docker Desktop** do menu Iniciar
2. Aguarde o ícone do Docker ficar verde
3. Verifique se está rodando: `docker ps`

### 2. **Git**
- ✅ Git instalado
- ✅ Repositório atualizado (commit `15ded72` enviado)

### 3. **Arquivo .env**
- ⚠️ Será criado automaticamente pelo script `deploy.sh`

---

## 🚀 Opção 1: Deploy Automático (Recomendado)

### Usando o script `deploy.sh`:

```bash
# No Git Bash ou WSL
cd C:\dev\secured-guard
bash deploy.sh
```

**O que o script faz:**
1. ✅ Verifica e cria arquivo `.env` com senhas seguras
2. ✅ Atualiza código do Git (`git pull`)
3. ✅ Compila o backend (Maven)
4. ✅ Compila o frontend (npm build)
5. ✅ Sobe Postgres (produção, dev e CI)
6. ✅ Executa migrações Flyway
7. ✅ Sobe todos os serviços Docker

**Ambientes criados:**
- 🟢 **PROD** - Produção (porta 8080)
- 🔵 **DEV** - Desenvolvimento (porta 8081)
- 🟡 **CI** - Continuous Integration (porta 8082)

---

## 🚀 Opção 2: Deploy Manual CI (Passo a Passo)

### 1. **Iniciar Docker Desktop**
```powershell
# Verificar se Docker está rodando
docker ps
```

### 2. **Criar Network (se não existir)**
```powershell
docker network create secured-guard
```

### 3. **Compilar Backend**
```powershell
cd backend
./mvnw clean package -DskipTests
cd ..
```

### 4. **Compilar Frontend**
```powershell
cd frontend
npm install
npm run build
cd ..
```

### 5. **Subir Ambiente CI**
```powershell
# Parar containers anteriores
docker compose -f deploy/docker-compose.ci.yml down

# Subir Postgres primeiro
docker compose -f deploy/docker-compose.ci.yml up -d postgres

# Aguardar 10 segundos
Start-Sleep -Seconds 10

# Subir backend (executará Flyway automaticamente)
docker compose -f deploy/docker-compose.ci.yml up -d backend

# Aguardar 20 segundos
Start-Sleep -Seconds 20

# Subir frontend, Redis e Nginx
docker compose -f deploy/docker-compose.ci.yml up -d redis frontend nginx
```

### 6. **Verificar Status**
```powershell
# Ver containers rodando
docker compose -f deploy/docker-compose.ci.yml ps

# Ver logs do backend
docker compose -f deploy/docker-compose.ci.yml logs backend

# Ver logs do frontend
docker compose -f deploy/docker-compose.ci.yml logs frontend
```

---

## 🔧 Configuração do Ambiente CI

### Portas Utilizadas:
- **55432** - PostgreSQL CI
- **6380** - Redis CI
- **8081** - Backend CI (interno)
- **5174** - Frontend CI (interno)
- **8080** - Nginx CI (acesso externo)

### Credenciais (Padrão):
- **Database:** `secured_guard_test`
- **Username:** `postgres`
- **Password:** `postgres`

### URLs de Acesso:
- **Frontend:** `http://localhost:8080`
- **Backend API:** `http://localhost:8080/api`
- **Backend Direto:** `http://localhost:8081`

---

## 🧪 Testando o Deploy CI

### 1. **Verificar Backend**
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:8081/actuator/health"

# Endpoint de auth
Invoke-WebRequest -Uri "http://localhost:8081/api/auth/login" -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"jose.ramos","password":"senha123"}'
```

### 2. **Verificar Frontend**
```powershell
# Acessar no navegador
Start-Process "http://localhost:8080"
```

### 3. **Verificar Postgres**
```powershell
# Conectar ao banco
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test -c "\dt"
```

### 4. **Verificar Logs**
```powershell
# Backend
docker compose -f deploy/docker-compose.ci.yml logs -f backend

# Frontend
docker compose -f deploy/docker-compose.ci.yml logs -f frontend

# Todos os serviços
docker compose -f deploy/docker-compose.ci.yml logs -f
```

---

## 🐛 Troubleshooting

### Problema 1: Docker Desktop não inicia
**Solução:**
```powershell
# Reiniciar serviço do Docker
Restart-Service docker

# Ou reiniciar Docker Desktop manualmente
```

### Problema 2: Porta em uso
**Solução:**
```powershell
# Verificar o que está usando a porta
netstat -ano | findstr :8080

# Matar processo
taskkill /F /PID [PID]
```

### Problema 3: Backend não sobe
**Solução:**
```powershell
# Ver logs detalhados
docker compose -f deploy/docker-compose.ci.yml logs backend

# Reiniciar backend
docker compose -f deploy/docker-compose.ci.yml restart backend
```

### Problema 4: Migrations falhando
**Solução:**
```powershell
# Conectar ao banco e verificar
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test

# Dentro do psql:
\dt flyway_schema_history
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
```

### Problema 5: Frontend não carrega
**Solução:**
```powershell
# Verificar se o build existe
ls frontend/dist

# Recompilar frontend
cd frontend
npm run build
cd ..

# Recriar container
docker compose -f deploy/docker-compose.ci.yml up -d --build frontend
```

---

## 🔄 Comandos Úteis

### Parar Ambiente CI:
```powershell
docker compose -f deploy/docker-compose.ci.yml down
```

### Parar e Limpar Tudo:
```powershell
docker compose -f deploy/docker-compose.ci.yml down -v
```

### Recompilar e Reiniciar:
```powershell
# Backend
cd backend; ./mvnw clean package -DskipTests; cd ..
docker compose -f deploy/docker-compose.ci.yml up -d --build backend

# Frontend
cd frontend; npm run build; cd ..
docker compose -f deploy/docker-compose.ci.yml up -d --build frontend
```

### Ver Recursos Utilizados:
```powershell
docker stats
```

### Backup do Banco CI:
```powershell
docker compose -f deploy/docker-compose.ci.yml exec postgres pg_dump -U postgres secured_guard_test > backup_ci.sql
```

---

## 📊 Monitoramento

### Health Checks:
- **Backend:** `http://localhost:8081/actuator/health`
- **Frontend:** `http://localhost:5174`
- **Postgres:** Container com healthcheck automático
- **Redis:** Container com healthcheck automático

### Logs em Tempo Real:
```powershell
# Todos os serviços
docker compose -f deploy/docker-compose.ci.yml logs -f

# Apenas backend
docker compose -f deploy/docker-compose.ci.yml logs -f backend

# Últimas 100 linhas
docker compose -f deploy/docker-compose.ci.yml logs --tail=100
```

---

## 🎯 Próximos Passos Após Deploy

1. **Acessar o sistema:** `http://localhost:8080`
2. **Fazer login** com usuário admin
3. **Testar funcionalidades:**
   - ✅ Login como SUPER_ADMIN
   - ✅ Login como COLABORADOR → Dashboard Colaborador
   - ✅ Login como VIGILANTE → Dashboard Vigilante
   - ✅ Download de holerites
   - ✅ Relatórios de equipamentos
   - ✅ Comunicação interna

4. **Executar testes automatizados** (se tiver)
5. **Monitorar logs** para erros
6. **Verificar performance**

---

## 📝 Checklist de Deploy CI

- [ ] Docker Desktop iniciado
- [ ] Network `secured-guard` criada
- [ ] Backend compilado (`mvnw package`)
- [ ] Frontend compilado (`npm run build`)
- [ ] Postgres CI rodando (porta 55432)
- [ ] Backend CI rodando (porta 8081)
- [ ] Frontend CI rodando (porta 5174)
- [ ] Nginx CI rodando (porta 8080)
- [ ] Health checks passando
- [ ] Migrations executadas com sucesso
- [ ] Sistema acessível em `http://localhost:8080`
- [ ] Login funcionando
- [ ] Dashboards exclusivos funcionando

---

**Criado em:** 23/10/2025  
**Ambiente:** CI (Continuous Integration)  
**Status:** ⚠️ **Aguardando Docker Desktop**

