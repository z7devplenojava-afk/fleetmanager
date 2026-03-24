# 🚀 GitHub Actions - Deploy Automático na VPS

## 📋 Resumo
Este guia mostra como configurar o GitHub Actions para fazer deploy automático na VPS sempre que houver um push na branch `main`.

## ✅ O QUE FOI IMPLEMENTADO

### 📄 Workflow Criado:
**Arquivo:** `.github/workflows/deploy-vps.yml`

**Trigger:** 
- ✅ Push na branch `main`
- ✅ Execução manual via GitHub UI

**Etapas do Deploy:**
1. ✅ Checkout do código
2. ✅ Setup Java 17 (Amazon Corretto)
3. ✅ Build do Backend (Maven)
4. ✅ Setup Node.js 18
5. ✅ Build do Frontend (Vite)
6. ✅ Criar arquivo `.env` com secrets
7. ✅ Preparar pacote de deploy
8. ✅ Conectar na VPS via SSH
9. ✅ Transferir arquivos via SCP
10. ✅ Executar deploy com Docker Compose
11. ✅ Verificar health do backend
12. ✅ Notificar sucesso/erro

---

## 🔐 CONFIGURAR SECRETS NO GITHUB

### 1. **Acessar Configurações do Repositório**

1. Vá para: `https://github.com/zemarioramos/secured-guard`
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

### 2. **Secrets Necessários**

Adicione os seguintes secrets (um por um):

#### **A. Configurações da VPS**

**`VPS_HOST`**
- **Descrição:** IP ou domínio da VPS
- **Exemplo:** `192.168.1.100` ou `seu-servidor.com`
- **Valor:** Cole o IP da sua VPS

**`VPS_USER`**
- **Descrição:** Usuário SSH da VPS
- **Exemplo:** `root` ou `ubuntu` ou `admin`
- **Valor:** Cole o nome de usuário

**`VPS_SSH_KEY`**
- **Descrição:** Chave SSH privada para acesso à VPS
- **Como obter:**
  ```bash
  # No seu computador, ver a chave privada
  cat ~/.ssh/id_rsa
  # Ou se usar outra chave
  cat ~/.ssh/vps_key
  ```
- **Valor:** Cole TODO o conteúdo da chave privada, incluindo:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  [conteúdo da chave]
  -----END OPENSSH PRIVATE KEY-----
  ```

**`VPS_PORT`** (Opcional)
- **Descrição:** Porta SSH (padrão: 22)
- **Valor:** `22` (ou a porta SSH customizada)

**`VPS_URL`** (Opcional)
- **Descrição:** URL pública do sistema
- **Exemplo:** `https://secured-guard.com`

#### **B. Configurações do Banco de Dados**

**`POSTGRES_DB`**
- **Valor:** `secured_guard_prod`

**`POSTGRES_USER`**
- **Valor:** `postgressg`

**`POSTGRES_PASSWORD`**
- **Descrição:** Senha do PostgreSQL
- **Gerar senha segura:**
  ```bash
  openssl rand -base64 24
  ```
- **Valor:** Cole a senha gerada

#### **C. Configurações do Redis**

**`REDIS_PASSWORD`**
- **Descrição:** Senha do Redis
- **Gerar senha segura:**
  ```bash
  openssl rand -base64 24
  ```
- **Valor:** Cole a senha gerada

#### **D. Configurações da Aplicação**

**`JWT_SECRET`**
- **Descrição:** Chave secreta para geração de tokens JWT
- **Gerar senha segura:**
  ```bash
  openssl rand -base64 64
  ```
- **Valor:** Cole a senha gerada (deve ter pelo menos 256 bits)

**`VITE_API_URL`**
- **Descrição:** URL da API para o frontend
- **Valor:** `https://seu-dominio.com/api` ou `http://seu-ip:8080/api`

**`VITE_WS_URL`**
- **Descrição:** URL do WebSocket para o frontend
- **Valor:** `wss://seu-dominio.com/ws` ou `ws://seu-ip:8080/ws`

---

## 🔑 CONFIGURAR SSH NA VPS

### 1. **Adicionar Chave SSH na VPS**

Se você ainda não tem uma chave SSH configurada:

```bash
# No seu computador local
ssh-keygen -t rsa -b 4096 -C "deploy-secured-guard"

# Copiar chave pública para VPS
ssh-copy-id -i ~/.ssh/id_rsa.pub usuario@ip-da-vps

# Testar conexão
ssh usuario@ip-da-vps
```

### 2. **Preparar VPS**

Na VPS, execute:

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Criar diretório de deploy
mkdir -p ~/secured-guard-deploy
cd ~/secured-guard-deploy

# Criar network Docker
docker network create secured-guard || true
```

---

## 📊 RESUMO DOS SECRETS

| Secret | Descrição | Exemplo | Obrigatório |
|--------|-----------|---------|-------------|
| `VPS_HOST` | IP/domínio da VPS | `192.168.1.100` | ✅ Sim |
| `VPS_USER` | Usuário SSH | `root` | ✅ Sim |
| `VPS_SSH_KEY` | Chave SSH privada | `-----BEGIN OPENSSH...` | ✅ Sim |
| `VPS_PORT` | Porta SSH | `22` | ⚠️ Opcional |
| `VPS_URL` | URL pública | `https://secured-guard.com` | ⚠️ Opcional |
| `POSTGRES_DB` | Nome do banco | `secured_guard_prod` | ✅ Sim |
| `POSTGRES_USER` | Usuário do banco | `postgressg` | ✅ Sim |
| `POSTGRES_PASSWORD` | Senha do banco | `[senha gerada]` | ✅ Sim |
| `REDIS_PASSWORD` | Senha do Redis | `[senha gerada]` | ✅ Sim |
| `JWT_SECRET` | Secret do JWT | `[senha 64 bytes]` | ✅ Sim |
| `VITE_API_URL` | URL da API | `https://api.com/api` | ✅ Sim |
| `VITE_WS_URL` | URL do WebSocket | `wss://api.com/ws` | ✅ Sim |

---

## 🚀 COMO USAR

### Deploy Automático:

1. **Fazer commit e push:**
   ```bash
   git add .
   git commit -m "feat: nova funcionalidade"
   git push origin main
   ```

2. **GitHub Actions dispara automaticamente:**
   - Compila backend
   - Compila frontend
   - Envia para VPS
   - Executa deploy com Docker

3. **Acompanhar progresso:**
   - Vá para: `https://github.com/zemarioramos/secured-guard/actions`
   - Clique no workflow em execução
   - Veja logs em tempo real

### Deploy Manual:

1. **Acessar GitHub:**
   - Vá para: `https://github.com/zemarioramos/secured-guard/actions`
   - Clique em **Deploy to VPS**
   - Clique em **Run workflow**
   - Selecione branch `main`
   - Clique em **Run workflow**

2. **Aguardar conclusão:**
   - Veja o progresso em tempo real
   - Verifique logs de cada etapa

---

## 📝 ESTRUTURA DO DEPLOY

### Na VPS, o sistema ficará em:
```
~/secured-guard-deploy/
├── app.jar                    # Backend compilado
├── frontend-dist/             # Frontend compilado
├── docker-compose.prod.yml    # Configuração Docker
├── nginx.conf                 # Configuração Nginx
├── .env                       # Variáveis de ambiente
└── deploy-to-vps.sh          # Script de deploy
```

### Containers Docker:
```
secured-guard-db-prod        # PostgreSQL (porta 5432)
secured-guard-redis-prod     # Redis (porta 6379)
secured-guard-backend-prod   # Backend (porta 8080)
secured-guard-frontend-prod  # Frontend (porta 3000)
secured-guard-nginx-prod     # Nginx (porta 80/443)
```

---

## 🔍 MONITORAMENTO

### Ver Status dos Containers:
```bash
ssh usuario@vps-ip
cd ~/secured-guard-deploy
docker compose -f docker-compose.prod.yml ps
```

### Ver Logs:
```bash
# Todos os serviços
docker compose -f docker-compose.prod.yml logs -f

# Apenas backend
docker compose -f docker-compose.prod.yml logs -f backend

# Apenas frontend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Reiniciar Serviço:
```bash
# Reiniciar backend
docker compose -f docker-compose.prod.yml restart backend

# Reiniciar tudo
docker compose -f docker-compose.prod.yml restart
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: SSH Key inválida
**Erro:** `Permission denied (publickey)`

**Solução:**
1. Verifique se a chave SSH está correta
2. Teste localmente: `ssh -i ~/.ssh/id_rsa usuario@vps-ip`
3. Certifique-se de copiar TODO o conteúdo da chave privada no secret

### Problema 2: Build falhou
**Erro:** `Maven/NPM build failed`

**Solução:**
1. Verifique os logs do workflow
2. Execute o build localmente para verificar erros
3. Corrija os erros e faça novo commit

### Problema 3: VPS sem espaço
**Erro:** `No space left on device`

**Solução:**
```bash
# Na VPS, limpar containers antigos
docker system prune -a --volumes

# Verificar espaço
df -h
```

### Problema 4: Porta em uso
**Erro:** `Port already in use`

**Solução:**
```bash
# Na VPS, verificar o que está usando a porta
sudo netstat -tulpn | grep :8080

# Matar processo ou mudar porta no docker-compose
```

### Problema 5: Database connection failed
**Erro:** `Connection refused to postgres`

**Solução:**
```bash
# Na VPS, verificar se Postgres está rodando
docker compose -f docker-compose.prod.yml ps postgres

# Ver logs do Postgres
docker compose -f docker-compose.prod.yml logs postgres

# Reiniciar Postgres
docker compose -f docker-compose.prod.yml restart postgres
```

---

## 🔄 ROLLBACK

Se o deploy falhar, você pode fazer rollback:

```bash
# Na VPS
cd ~/secured-guard-deploy

# Parar containers atuais
docker compose -f docker-compose.prod.yml down

# Restaurar .env anterior
cp .env.backup.[data] .env

# Usar imagem anterior do backend/frontend
# (Docker mantém cache de imagens antigas)

# Subir novamente
docker compose -f docker-compose.prod.yml up -d
```

---

## 📈 MELHORIAS FUTURAS

### 1. **Adicionar Testes Automatizados**
```yaml
- name: 🧪 Executar Testes
  run: |
    cd backend
    ./mvnw test
```

### 2. **Deploy em Stages**
```yaml
- name: Deploy Staging
  if: github.ref == 'refs/heads/develop'
  
- name: Deploy Production
  if: github.ref == 'refs/heads/main'
```

### 3. **Notificações**
- Slack
- Discord
- Email
- Telegram

### 4. **Backup Automático Antes do Deploy**
```yaml
- name: 🗄️ Backup Database
  run: |
    ssh usuario@vps "docker compose exec postgres pg_dump -U postgres secured_guard_prod > backup_$(date +%Y%m%d).sql"
```

### 5. **Health Check Completo**
```yaml
- name: 🏥 Health Check
  run: |
    curl -f https://seu-dominio.com/api/actuator/health
    curl -f https://seu-dominio.com/
```

---

## 🎯 PRÓXIMOS PASSOS

### 1. **Configurar Secrets no GitHub**
- Vá para: Settings → Secrets and variables → Actions
- Adicione todos os secrets listados acima

### 2. **Testar o Workflow**
```bash
# Fazer um commit de teste
git commit --allow-empty -m "test: Testar GitHub Actions deploy"
git push origin main

# Acompanhar em: https://github.com/zemarioramos/secured-guard/actions
```

### 3. **Verificar na VPS**
```bash
# Conectar na VPS
ssh usuario@vps-ip

# Verificar containers
cd ~/secured-guard-deploy
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4. **Acessar o Sistema**
- Frontend: `http://seu-ip:80` ou `https://seu-dominio.com`
- Backend API: `http://seu-ip:8080/api`
- Swagger: `http://seu-ip:8080/swagger-ui.html`

---

## 📊 FLUXO DE DEPLOY

```
┌─────────────────────────────────────────────────────────┐
│  DESENVOLVEDOR                                          │
│  git push origin main                                   │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS                                         │
│  ✅ Checkout código                                     │
│  ✅ Setup Java 17                                       │
│  ✅ Build Backend (Maven)                               │
│  ✅ Setup Node.js 18                                    │
│  ✅ Build Frontend (Vite)                               │
│  ✅ Criar .env com secrets                              │
│  ✅ Preparar pacote                                     │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼ SSH + SCP
┌─────────────────────────────────────────────────────────┐
│  VPS (SERVIDOR)                                         │
│  📁 ~/secured-guard-deploy/                             │
│     ├── app.jar                                         │
│     ├── frontend-dist/                                  │
│     ├── docker-compose.prod.yml                         │
│     ├── nginx.conf                                      │
│     └── .env                                            │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼ Docker Compose
┌─────────────────────────────────────────────────────────┐
│  CONTAINERS DOCKER                                      │
│  🐘 PostgreSQL    (porta 5432)                          │
│  📦 Redis         (porta 6379)                          │
│  ☕ Backend       (porta 8080)                          │
│  🎨 Frontend      (porta 3000)                          │
│  🌐 Nginx         (porta 80/443)                        │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  USUÁRIOS                                               │
│  🌐 Acesso: http://seu-dominio.com                      │
│  👤 Login: SUPER_ADMIN / COLABORADOR / VIGILANTE        │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 TESTAR LOCALMENTE ANTES DO DEPLOY

### Simular o Build do GitHub Actions:

```bash
# 1. Build Backend
cd backend
./mvnw clean package -DskipTests
cd ..

# 2. Build Frontend
cd frontend
npm ci
npm run build
cd ..

# 3. Verificar arquivos gerados
ls -lh backend/target/*.jar
ls -lh frontend/dist/
```

Se os builds passarem localmente, o GitHub Actions também passará.

---

## 📋 CHECKLIST PRE-DEPLOY

### No GitHub:
- [ ] Secrets configurados (11 secrets no total)
- [ ] Workflow criado (`.github/workflows/deploy-vps.yml`)
- [ ] Código commitado e pushed

### Na VPS:
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Usuário no grupo docker
- [ ] SSH configurado
- [ ] Chave SSH autorizada (`~/.ssh/authorized_keys`)
- [ ] Network `secured-guard` criada
- [ ] Portas abertas (80, 443, 8080)
- [ ] Firewall configurado

### Arquivos Necessários:
- [ ] `deploy/docker-compose.prod.yml`
- [ ] `deploy/nginx/nginx.conf`
- [ ] `backend/Dockerfile.prod`
- [ ] `frontend/Dockerfile.prod`

---

## 🎯 APÓS O DEPLOY

### 1. **Verificar Logs do GitHub Actions**
- Vá para: `https://github.com/zemarioramos/secured-guard/actions`
- Verifique se todas as etapas passaram
- Se houver erro, veja os logs detalhados

### 2. **Verificar na VPS**
```bash
# Conectar na VPS
ssh usuario@vps-ip

# Ver containers
docker ps

# Ver logs
docker logs secured-guard-backend-prod
docker logs secured-guard-frontend-prod
```

### 3. **Acessar o Sistema**
- Abra: `http://seu-ip` ou `https://seu-dominio.com`
- Faça login
- Teste as funcionalidades principais

### 4. **Verificar Health**
```bash
# Backend health
curl http://seu-ip:8080/actuator/health

# Deve retornar: {"status":"UP"}
```

---

## 🔐 SEGURANÇA

### Boas Práticas:

1. **Nunca commite secrets no código**
   - Use apenas GitHub Secrets
   - Adicione `.env` ao `.gitignore`

2. **Use HTTPS em produção**
   - Configure SSL/TLS
   - Use Let's Encrypt para certificados gratuitos

3. **Firewall na VPS**
   ```bash
   # Permitir apenas portas necessárias
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

4. **Senhas Fortes**
   - Use `openssl rand -base64 32` para gerar senhas
   - Mínimo 24 caracteres

5. **Backup Regular**
   ```bash
   # Agendar backup diário (crontab)
   0 2 * * * cd ~/secured-guard-deploy && docker compose exec postgres pg_dump -U postgres secured_guard_prod > backup_$(date +%Y%m%d).sql
   ```

---

## 📚 REFERÊNCIAS

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SSH Action](https://github.com/appleboy/ssh-action)
- [SCP Action](https://github.com/appleboy/scp-action)

---

**Criado em:** 23/10/2025  
**Status:** ✅ **Pronto para Configuração**  
**Workflow:** `.github/workflows/deploy-vps.yml`

