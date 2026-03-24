# 🔧 GUIA DE SETUP - DEPLOY CI

## 📋 Pré-requisitos na VPS

### 1️⃣ **Instalações Necessárias**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Java 17
sudo apt install -y openjdk-17-jdk

# Instalar Nginx
sudo apt install -y nginx

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 2️⃣ **Criar Banco de Dados CI**

```bash
# Entrar no PostgreSQL
sudo -u postgres psql

# Criar database e user
CREATE DATABASE secured_guard_ci;
CREATE USER secured_guard_ci WITH ENCRYPTED PASSWORD 'SUA_SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE secured_guard_ci TO secured_guard_ci;

# Dar permissões no schema public
\c secured_guard_ci
GRANT ALL ON SCHEMA public TO secured_guard_ci;

\q
```

### 3️⃣ **Configurar SSH Key para GitHub Actions**

```bash
# No seu computador local, gerar chave SSH
ssh-keygen -t ed25519 -C "github-actions-ci" -f ~/.ssh/github_ci_key

# Copiar chave pública para VPS
ssh-copy-id -i ~/.ssh/github_ci_key.pub usuario@vps-ip

# Testar conexão
ssh -i ~/.ssh/github_ci_key usuario@vps-ip

# Obter conteúdo da chave privada (para adicionar nos secrets)
cat ~/.ssh/github_ci_key
```

---

## 🔑 SECRETS DO GITHUB (Ambiente CI)

Vá em: **GitHub → Seu Repositório → Settings → Secrets and variables → Actions → New repository secret**

### **Secrets Necessários:**

| Secret Name | Descrição | Exemplo |
|-------------|-----------|---------|
| `VPS_CI_HOST` | IP ou hostname da VPS | `123.456.789.10` ou `vps.example.com` |
| `VPS_CI_USER` | Usuário SSH da VPS | `ubuntu` ou `root` |
| `VPS_CI_SSH_KEY` | Chave SSH privada (completa) | Conteúdo do arquivo `~/.ssh/github_ci_key` |
| `DB_CI_URL` | URL do banco PostgreSQL | `jdbc:postgresql://localhost:5432/secured_guard_ci` |
| `DB_CI_USERNAME` | Usuário do banco | `secured_guard_ci` |
| `DB_CI_PASSWORD` | Senha do banco | `senha_forte_aqui` |
| `JWT_SECRET_CI` | Secret JWT para CI | Gerar com: `openssl rand -base64 64` |

---

## 📝 COMO ADICIONAR OS SECRETS

### 1. **VPS_CI_HOST**
```
Valor: 123.456.789.10
```

### 2. **VPS_CI_USER**
```
Valor: ubuntu
```

### 3. **VPS_CI_SSH_KEY**
```bash
# Execute no seu PC:
cat ~/.ssh/github_ci_key

# Cole o resultado COMPLETO, incluindo:
-----BEGIN OPENSSH PRIVATE KEY-----
...conteúdo da chave...
-----END OPENSSH PRIVATE KEY-----
```

### 4. **DB_CI_URL**
```
Valor: jdbc:postgresql://localhost:5432/secured_guard_ci
```

### 5. **DB_CI_USERNAME**
```
Valor: secured_guard_ci
```

### 6. **DB_CI_PASSWORD**
```bash
# Gerar senha forte:
openssl rand -base64 24

# Usar a senha gerada
Valor: sua_senha_gerada_aqui
```

### 7. **JWT_SECRET_CI**
```bash
# Gerar secret JWT:
openssl rand -base64 64

# Usar o resultado
Valor: secret_jwt_gerado_aqui
```

---

## 🌐 CONFIGURAR DNS

No seu provedor de DNS (Cloudflare, Route53, etc.):

```
Tipo: A
Nome: ci
Valor: IP_DA_SUA_VPS
TTL: Auto ou 3600
Proxy: Desativado (se Cloudflare)
```

**Resultado:** `ci.z7botsolutions.com.br` → `123.456.789.10`

---

## 🔐 CONFIGURAR SSL (HTTPS)

Após o primeiro deploy bem-sucedido:

```bash
# SSH na VPS
ssh usuario@vps-ip

# Instalar certificado SSL
sudo certbot --nginx -d ci.z7botsolutions.com.br

# Responder as perguntas:
# - Email: seu@email.com
# - Termos: Yes
# - Share email: No
# - Redirect HTTP to HTTPS: Yes

# Testar renovação automática
sudo certbot renew --dry-run
```

---

## 🚀 CRIAR BRANCH CI E FAZER PRIMEIRO DEPLOY

### 1. **Criar Branch CI**

```bash
# No seu repositório local
cd /c/dev/secured-guard

# Criar branch ci a partir da main
git checkout main
git pull origin main
git checkout -b ci

# Fazer push da branch ci
git push -u origin ci
```

### 2. **Configurar application-ci.properties**

Crie o arquivo: `backend/src/main/resources/application-ci.properties`

```properties
# ===== PERFIL CI =====
spring.application.name=Secured Guard CI
server.port=8082

# ===== BANCO DE DADOS =====
spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# ===== FLYWAY =====
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration

# ===== UPLOADS =====
upload.dir=${UPLOAD_DIR:/var/www/secured-guard/ci/uploads}

# ===== LOGS =====
logging.level.root=INFO
logging.level.com.z7design.secured_guard=DEBUG
logging.file.name=${LOGGING_FILE_PATH:/var/www/secured-guard/ci/logs/application.log}

# ===== CORS =====
cors.allowed-origins=https://ci.z7botsolutions.com.br

# ===== JWT =====
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION:604800000}
```

### 3. **Criar .env.ci para frontend**

Crie o arquivo: `frontend/.env.ci`

```env
VITE_API_URL=https://ci.z7botsolutions.com.br/api
VITE_ENVIRONMENT=ci
VITE_APP_NAME=Secured Guard CI
```

### 4. **Commit e Push**

```bash
git add .github/workflows/deploy-ci.yml
git add backend/src/main/resources/application-ci.properties
git add frontend/.env.ci
git add DEPLOY_CI_SETUP.md

git commit -m "🚀 feat: Configurar deploy automatizado para ambiente CI"

git push origin ci
```

---

## 🎯 VERIFICAR DEPLOY

### 1. **Acompanhar GitHub Actions**

- Vá em: **GitHub → Actions**
- Clique no workflow: **🔧 Deploy CI Environment**
- Acompanhe os logs em tempo real

### 2. **Verificar na VPS**

```bash
# SSH na VPS
ssh usuario@vps-ip

# Ver status do serviço
sudo systemctl status secured-guard-ci

# Ver logs em tempo real
sudo journalctl -u secured-guard-ci -f

# Ou ver arquivo de log
tail -f /var/www/secured-guard/ci/logs/application.log
```

### 3. **Testar Aplicação**

```bash
# Health check
curl https://ci.z7botsolutions.com.br/api/health

# Backend API
curl https://ci.z7botsolutions.com.br/api/

# Frontend
curl -I https://ci.z7botsolutions.com.br/
```

### 4. **Acessar no Navegador**

Abra: **https://ci.z7botsolutions.com.br**

---

## 🔧 COMANDOS ÚTEIS NA VPS

### **Gerenciar Serviço**

```bash
# Ver status
sudo systemctl status secured-guard-ci

# Iniciar
sudo systemctl start secured-guard-ci

# Parar
sudo systemctl stop secured-guard-ci

# Reiniciar
sudo systemctl restart secured-guard-ci

# Ver logs
sudo journalctl -u secured-guard-ci -f --lines=100
```

### **Ver Logs da Aplicação**

```bash
# Log principal
tail -f /var/www/secured-guard/ci/logs/application.log

# Stdout
tail -f /var/www/secured-guard/ci/logs/stdout.log

# Stderr
tail -f /var/www/secured-guard/ci/logs/stderr.log
```

### **Listar Backups**

```bash
ls -lht /var/www/secured-guard/ci/backups/
```

### **Verificar Uso de Recursos**

```bash
# CPU e Memória
htop

# Espaço em disco
df -h /var/www/secured-guard/ci

# Tamanho dos uploads
du -sh /var/www/secured-guard/ci/uploads
```

---

## ❌ TROUBLESHOOTING

### **Erro: "Connection refused" ao acessar API**

```bash
# Verificar se o serviço está rodando
sudo systemctl status secured-guard-ci

# Ver porta 8082
sudo netstat -tlnp | grep 8082

# Se não estiver rodando, ver logs de erro
sudo journalctl -u secured-guard-ci --lines=50
```

### **Erro: "502 Bad Gateway" no Nginx**

```bash
# Verificar configuração do Nginx
sudo nginx -t

# Verificar se backend está rodando
curl http://localhost:8082/api/health

# Recarregar Nginx
sudo systemctl reload nginx
```

### **Erro: "Database connection failed"**

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão manual
psql -h localhost -U secured_guard_ci -d secured_guard_ci

# Verificar .env
cat /var/www/secured-guard/ci/.env
```

### **Fazer Rollback Manual**

```bash
# Parar serviço
sudo systemctl stop secured-guard-ci

# Restaurar último backup
LATEST_BACKUP=$(ls -t /var/www/secured-guard/ci/backups/ | head -1)
cp "/var/www/secured-guard/ci/backups/$LATEST_BACKUP/app.jar" \
   /var/www/secured-guard/ci/backend/

# Reiniciar
sudo systemctl start secured-guard-ci
```

---

## 📊 MONITORAMENTO

### **Logs em Tempo Real**

```bash
# Backend
tail -f /var/www/secured-guard/ci/logs/application.log

# Nginx access
sudo tail -f /var/log/nginx/secured-guard-ci-access.log

# Nginx errors
sudo tail -f /var/log/nginx/secured-guard-ci-error.log
```

### **Métricas de Performance**

```bash
# CPU/Memória do processo Java
ps aux | grep "secured-guard-ci"

# Estatísticas do Nginx
sudo systemctl status nginx
```

---

## ✅ CHECKLIST FINAL

Antes de fazer o primeiro deploy:

- [ ] VPS configurada com Java 17, Nginx, PostgreSQL
- [ ] Banco de dados `secured_guard_ci` criado
- [ ] SSH key configurada e testada
- [ ] Todos os secrets adicionados no GitHub
- [ ] DNS configurado (`ci.z7botsolutions.com.br`)
- [ ] Branch `ci` criada e enviada ao GitHub
- [ ] Workflow `.github/workflows/deploy-ci.yml` criado
- [ ] `application-ci.properties` criado no backend
- [ ] `.env.ci` criado no frontend

---

## 🎉 PRÓXIMOS PASSOS

Após o deploy CI estar funcionando:

1. ✅ **Testar CI completamente**
2. 🚀 **Criar deploy para DEV** (branch `dev`)
3. 🧪 **Criar deploy para TEST** (branch `test`)
4. 🏭 **Criar deploy para PROD** (branch `main`)

---

**Data de Criação**: 23/10/2025  
**Ambiente**: CI (Integração Contínua)  
**URL**: https://ci.z7botsolutions.com.br

